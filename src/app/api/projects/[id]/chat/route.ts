import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { chatWithProjectContext, ProjectChatMessage } from "@/lib/openrouter";

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function checkRateLimit(userId: string, projectId: string): boolean {
  const key = `${userId}:${projectId}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Stop words for keyword extraction
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "must", "can",
  "to", "of", "in", "for", "on", "with", "at", "by", "from",
  "as", "into", "through", "during", "before", "after", "above",
  "below", "between", "under", "again", "further", "then", "once",
  "here", "there", "when", "where", "why", "how", "all", "each",
  "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very",
  "what", "which", "who", "whom", "this", "that", "these", "those",
  "i", "me", "my", "we", "our", "you", "your", "he", "him", "his",
  "she", "her", "it", "its", "they", "them", "their", "about",
  "progress", "status", "task", "tasks", "feature", "features",
  "project", "done", "complete", "blocker", "blockers", "working",
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

// Fetch project with all related data for chat context
async function fetchProjectContext(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      repo: {
        select: {
          id: true,
          name: true,
          fullName: true,
          url: true,
          indexStatus: {
            select: {
              lastIndexedAt: true,
              totalFiles: true,
              totalChunks: true,
            },
          },
        },
      },
      features: {
        include: {
          tasks: {
            include: {
              assignee: { select: { id: true, name: true, email: true } },
              linkedPR: {
                select: {
                  number: true,
                  title: true,
                  url: true,
                  status: true,
                  branchName: true,
                },
              },
            },
            orderBy: [{ status: "asc" }, { priority: "desc" }, { order: "asc" }],
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return project;
}

// Calculate project statistics
function calculateProjectStats(project: NonNullable<Awaited<ReturnType<typeof fetchProjectContext>>>) {
  const allTasks = project.features.flatMap((f) => f.tasks);

  const stats = {
    totalTasks: allTasks.length,
    byStatus: {
      BACKLOG: allTasks.filter((t) => t.status === "BACKLOG").length,
      IN_PROGRESS: allTasks.filter((t) => t.status === "IN_PROGRESS").length,
      REVIEW: allTasks.filter((t) => t.status === "REVIEW").length,
      DONE: allTasks.filter((t) => t.status === "DONE").length,
    },
    byCategory: {
      BACKEND: allTasks.filter((t) => t.category === "BACKEND").length,
      FRONTEND: allTasks.filter((t) => t.category === "FRONTEND").length,
      DESIGN: allTasks.filter((t) => t.category === "DESIGN").length,
      QA: allTasks.filter((t) => t.category === "QA").length,
      DEVOPS: allTasks.filter((t) => t.category === "DEVOPS").length,
    },
    byPriority: {
      URGENT: allTasks.filter((t) => t.priority === "URGENT").length,
      HIGH: allTasks.filter((t) => t.priority === "HIGH").length,
      MEDIUM: allTasks.filter((t) => t.priority === "MEDIUM").length,
      LOW: allTasks.filter((t) => t.priority === "LOW").length,
    },
    completionPercentage: allTasks.length > 0
      ? Math.round((allTasks.filter((t) => t.status === "DONE").length / allTasks.length) * 100)
      : 0,
    tasksWithPRs: allTasks.filter((t) => t.linkedPR).length,
    mergedPRs: allTasks.filter((t) => t.linkedPR?.status === "MERGED").length,
  };

  return stats;
}

// Search code chunks for relevant context
async function searchCodeChunks(
  repoId: string,
  keywords: string[]
): Promise<Array<{ filePath: string; content: string; startLine: number; endLine: number }>> {
  if (keywords.length === 0) return [];

  const chunks = await prisma.codeChunk.findMany({
    where: {
      file: { repoId },
      OR: keywords.flatMap((keyword) => [
        { keywords: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ]),
    },
    include: {
      file: { select: { filePath: true } },
    },
    take: 20,
  });

  // Score and rank results
  const scored = chunks.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const keywordsLower = chunk.keywords.toLowerCase();
    const filePathLower = chunk.file.filePath.toLowerCase();

    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      const keywordMatches = (keywordsLower.match(new RegExp(kwLower, "g")) || []).length;
      score += keywordMatches * 3;
      const contentMatches = (contentLower.match(new RegExp(kwLower, "g")) || []).length;
      score += contentMatches;
      if (filePathLower.includes(kwLower)) {
        score += 5;
      }
    }

    return {
      filePath: chunk.file.filePath,
      content: chunk.content,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      score,
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ score, ...chunk }) => chunk);
}

// Search knowledge base for additional context
async function searchKnowledgeBase(
  projectId: string,
  keywords: string[]
): Promise<Array<{ id: string; title: string; content: string; category: string }>> {
  if (keywords.length === 0) return [];

  const entries = await prisma.knowledgeBaseEntry.findMany({
    where: {
      projectId,
      OR: keywords.flatMap((keyword) => [
        { title: { contains: keyword, mode: "insensitive" } },
        { content: { contains: keyword, mode: "insensitive" } },
      ]),
    },
    select: { id: true, title: true, content: true, category: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return entries;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Check rate limit
    if (!checkRateLimit(session.user.id, projectId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment before sending another message." },
        { status: 429 }
      );
    }

    // Fetch full project context
    const project = await fetchProjectContext(projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { messages, question } = body as {
      messages?: ProjectChatMessage[];
      question: string;
    };

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Check for OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Calculate project statistics
    const stats = calculateProjectStats(project);

    // Extract keywords for code/KB search
    const keywords = extractKeywords(question);

    // Search code if repo is linked and indexed
    let codeChunks: Array<{ filePath: string; content: string; startLine: number; endLine: number }> = [];
    if (project.repo) {
      codeChunks = await searchCodeChunks(project.repo.id, keywords);
    }

    // Search knowledge base for additional context
    const kbEntries = await searchKnowledgeBase(projectId, keywords);

    // Prepare messages for AI
    const chatMessages: ProjectChatMessage[] = [
      ...(messages || []),
      { role: "user", content: question.trim() },
    ];

    const response = await chatWithProjectContext(chatMessages, {
      project: {
        id: project.id,
        name: project.name,
        prefix: project.prefix,
        description: project.description,
        status: project.status,
        lead: project.lead,
        creator: project.creator,
        repo: project.repo ? {
          name: project.repo.name,
          fullName: project.repo.fullName,
          url: project.repo.url,
          indexed: !!project.repo.indexStatus?.lastIndexedAt,
          totalFiles: project.repo.indexStatus?.totalFiles || 0,
        } : null,
      },
      stats,
      features: project.features.map((f) => ({
        id: f.id,
        name: f.name,
        description: f.description,
        progress: f.progress,
        tasks: f.tasks.map((t) => ({
          id: t.id,
          taskNumber: t.taskNumber,
          title: t.title,
          description: t.description,
          status: t.status,
          category: t.category,
          priority: t.priority,
          assignee: t.assignee ? { name: t.assignee.name, email: t.assignee.email } : null,
          linkedPR: t.linkedPR ? {
            number: t.linkedPR.number,
            title: t.linkedPR.title,
            url: t.linkedPR.url,
            status: t.linkedPR.status,
          } : null,
          updatedAt: t.updatedAt,
        })),
      })),
      codeChunks: codeChunks.length > 0 ? codeChunks : undefined,
      kbEntries: kbEntries.length > 0 ? kbEntries : undefined,
    });

    return NextResponse.json({
      answer: response.answer,
      sources: response.sourcesUsed || [],
      codeFiles: response.codeFilesUsed || [],
      tasksMentioned: response.tasksMentioned || [],
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to process chat request",
      },
      { status: 500 }
    );
  }
}
