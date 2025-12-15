import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  analyzeTaskCompletion,
  TaskForAnalysis,
  CodeChunkForAnalysis,
  TaskAnalysisResult,
  TaskStatus,
} from "@/lib/openrouter";

// Rate limiting - more restrictive since this is expensive
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // requests per 5 minutes
const RATE_WINDOW = 300000; // 5 minutes in ms

function checkRateLimit(userId: string, projectId: string): boolean {
  const key = `analyze:${userId}:${projectId}`;
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

// Extract keywords from task title and description
function extractTaskKeywords(task: { title: string; description: string | null }): string[] {
  const text = `${task.title} ${task.description || ""}`;
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "this", "that", "and", "or", "but",
    "should", "must", "will", "can", "need", "needs", "have", "has",
    "task", "feature", "functionality", "component", "system",
  ]);

  // Keep technical compound words intact (e.g., web3auth, datanft, supabase)
  const technicalTerms = text.match(/\b[a-zA-Z0-9]+(?:[A-Z][a-z]+)+\b|\b\w+(?:auth|nft|api|sdk|ui|db)\b/gi) || [];

  // Split camelCase into parts as well
  const splitCamelCase = text
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();

  const baseWords = splitCamelCase
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Combine technical terms + base words, deduplicate
  const combinedKeywords = [
    ...technicalTerms.map((t) => t.toLowerCase()),
    ...baseWords,
  ];
  const allKeywords = Array.from(new Set(combinedKeywords));

  // Prioritize action verbs and nouns for searching
  const actionKeywords = allKeywords.filter((w) =>
    !["implement", "add", "create", "update", "fix", "build", "develop", "design", "set"].includes(w)
  );

  return actionKeywords.length > 0 ? actionKeywords : allKeywords;
}

// File extensions that represent actual source code
const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "py", "go", "java", "kt", "rs", "rb", "php",
  "c", "cpp", "h", "hpp", "cs", "swift", "vue", "svelte", "prisma", "graphql",
]);

// Files/patterns to exclude from analysis (documentation, configs, etc.)
const EXCLUDE_PATTERNS = [
  /readme/i, /\.md$/i, /setup/i, /deployment/i, /\.json$/i, /\.yaml$/i,
  /\.yml$/i, /\.config\./i, /\.env/i, /license/i, /changelog/i,
];

function isSourceCodeFile(filePath: string): boolean {
  // Check if it's excluded by pattern
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return false;
  }
  // Check if it has a code extension
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return CODE_EXTENSIONS.has(ext);
}

// Search code chunks relevant to a task using two-stage approach
async function searchCodeChunksForTask(
  repoId: string,
  keywords: string[]
): Promise<CodeChunkForAnalysis[]> {
  if (keywords.length === 0) return [];

  const searchKeywords = keywords.slice(0, 5);

  // Stage 1: Search by file path matches (highest priority)
  const filePathConditions = searchKeywords.map((keyword) => ({
    filePath: { contains: keyword, mode: "insensitive" as const },
  }));

  const pathMatchChunks = await prisma.codeChunk.findMany({
    where: {
      file: {
        repoId,
        OR: filePathConditions,
      },
    },
    include: {
      file: { select: { filePath: true } },
    },
    take: 15,
  });

  // Stage 2: Search by content/keywords for additional context
  const contentConditions = searchKeywords.flatMap((keyword) => [
    { keywords: { contains: keyword, mode: "insensitive" as const } },
    { content: { contains: keyword, mode: "insensitive" as const } },
  ]);

  const contentMatchChunks = await prisma.codeChunk.findMany({
    where: {
      file: { repoId },
      OR: contentConditions,
    },
    include: {
      file: { select: { filePath: true } },
    },
    take: 20,
  });

  // Combine and deduplicate by chunk id
  const seenIds = new Set<string>();
  const allChunks = [...pathMatchChunks, ...contentMatchChunks].filter((chunk) => {
    if (seenIds.has(chunk.id)) return false;
    seenIds.add(chunk.id);
    return true;
  });

  // Score and rank, heavily prioritizing source code files
  const scored = allChunks.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const keywordsLower = (chunk.keywords || "").toLowerCase();
    const filePathLower = chunk.file.filePath.toLowerCase();
    const isCode = isSourceCodeFile(chunk.file.filePath);

    // Base score from keyword matching
    for (const kw of searchKeywords) {
      const kwLower = kw.toLowerCase();
      if (keywordsLower.includes(kwLower)) score += 3;
      if (contentLower.includes(kwLower)) score += 1;
      if (filePathLower.includes(kwLower)) score += 5;
    }

    // MAJOR boost for actual source code files
    if (isCode) {
      score *= 3; // Triple the score for source code
      // Extra boost for implementation patterns
      if (contentLower.includes("export") || contentLower.includes("function") ||
          contentLower.includes("class") || contentLower.includes("async")) {
        score += 10;
      }
      // API routes are strong evidence
      if (filePathLower.includes("/api/") || filePathLower.includes("route")) {
        score += 15;
      }
    } else {
      // Penalize non-code files heavily
      score = Math.floor(score / 4);
    }

    return {
      filePath: chunk.file.filePath,
      content: chunk.content,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      score,
      isCode,
    };
  });

  // Prioritize source code files, then sort by score
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      // Source code files first
      if (a.isCode && !b.isCode) return -1;
      if (!a.isCode && b.isCode) return 1;
      // Then by score
      return b.score - a.score;
    })
    .slice(0, 5) // Return top 5 chunks
    .map(({ score, isCode, ...chunk }) => chunk);
}

// Update task status and project completion count
async function applyTaskStatusUpdate(
  taskId: string,
  newStatus: TaskStatus,
  currentStatus: TaskStatus
): Promise<void> {
  // Get task with feature to find project
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { featureId: true },
  });

  if (!task) return;

  const feature = await prisma.feature.findUnique({
    where: { id: task.featureId },
    select: { projectId: true },
  });

  if (!feature) return;

  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
  });

  // Update project completion count
  if (newStatus === "DONE" && currentStatus !== "DONE") {
    await prisma.project.update({
      where: { id: feature.projectId },
      data: { completedTasks: { increment: 1 } },
    });
  } else if (newStatus !== "DONE" && currentStatus === "DONE") {
    await prisma.project.update({
      where: { id: feature.projectId },
      data: { completedTasks: { decrement: 1 } },
    });
  }
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

    // Rate limiting
    if (!checkRateLimit(session.user.id, projectId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a few minutes before analyzing again." },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const {
      autoApply = false,
      confidenceThreshold = 80,
      taskIds, // Optional: analyze specific tasks only
    } = body as {
      autoApply?: boolean;
      confidenceThreshold?: number;
      taskIds?: string[];
    };

    // Check for OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Fetch project with repo and tasks
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        repo: {
          select: {
            id: true,
            indexStatus: {
              select: { lastIndexedAt: true },
            },
          },
        },
        features: {
          include: {
            tasks: {
              where: taskIds ? { id: { in: taskIds } } : { status: { not: "DONE" } },
              include: {
                linkedPR: {
                  select: {
                    number: true,
                    title: true,
                    status: true,
                    branchName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if codebase is indexed
    const isIndexed = project.repo?.indexStatus?.lastIndexedAt != null;
    if (!isIndexed) {
      return NextResponse.json(
        {
          error: "Codebase not indexed",
          message: "Please index the codebase first via the Knowledge Base tab before running AI analysis.",
        },
        { status: 400 }
      );
    }

    // Gather all tasks to analyze
    const tasksToAnalyze: TaskForAnalysis[] = project.features.flatMap((f) =>
      f.tasks.map((t) => ({
        id: t.id,
        taskNumber: t.taskNumber,
        title: t.title,
        description: t.description,
        status: t.status as TaskStatus,
        category: t.category,
        priority: t.priority,
        linkedPR: t.linkedPR
          ? {
              number: t.linkedPR.number,
              title: t.linkedPR.title,
              status: t.linkedPR.status,
              branchName: t.linkedPR.branchName,
            }
          : null,
      }))
    );

    if (tasksToAnalyze.length === 0) {
      return NextResponse.json({
        analyzed: 0,
        suggestions: [],
        autoApplied: 0,
        message: "No tasks to analyze (all tasks are already DONE or no matching tasks found)",
      });
    }

    // Analyze each task
    const suggestions: (TaskAnalysisResult & { applied: boolean })[] = [];
    let autoAppliedCount = 0;

    for (const task of tasksToAnalyze) {
      // Get relevant code chunks for this task
      const keywords = extractTaskKeywords(task);
      const codeChunks = await searchCodeChunksForTask(project.repo!.id, keywords);

      // Analyze the task
      const result = await analyzeTaskCompletion(task, codeChunks);

      // Determine if we should auto-apply
      const shouldAutoApply =
        autoApply &&
        result.confidence >= confidenceThreshold &&
        result.suggestedStatus !== result.currentStatus &&
        // Safety: never auto-move backward (except REVIEW → DONE)
        (statusOrder(result.suggestedStatus) > statusOrder(result.currentStatus) ||
          (result.currentStatus === "REVIEW" && result.suggestedStatus === "DONE"));

      let applied = false;

      if (shouldAutoApply) {
        try {
          await applyTaskStatusUpdate(
            task.id,
            result.suggestedStatus,
            result.currentStatus
          );
          applied = true;
          autoAppliedCount++;
        } catch (error) {
          console.error(`Failed to auto-apply status for task ${task.id}:`, error);
        }
      }

      // Only include in suggestions if status change is recommended
      if (result.suggestedStatus !== result.currentStatus) {
        suggestions.push({ ...result, applied });
      }
    }

    return NextResponse.json({
      analyzed: tasksToAnalyze.length,
      suggestions,
      autoApplied: autoAppliedCount,
    });
  } catch (error) {
    console.error("Task analysis error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze tasks",
      },
      { status: 500 }
    );
  }
}

// Helper to determine status order for comparison
function statusOrder(status: TaskStatus): number {
  const order: Record<TaskStatus, number> = {
    BACKLOG: 0,
    IN_PROGRESS: 1,
    REVIEW: 2,
    DONE: 3,
  };
  return order[status];
}

// GET endpoint to check analysis availability
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        repo: {
          select: {
            id: true,
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
          select: {
            tasks: {
              where: { status: { not: "DONE" } },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isIndexed = project.repo?.indexStatus?.lastIndexedAt != null;
    const tasksToAnalyze = project.features.flatMap((f) => f.tasks).length;

    return NextResponse.json({
      available: isIndexed && tasksToAnalyze > 0,
      isIndexed,
      tasksToAnalyze,
      indexInfo: project.repo?.indexStatus
        ? {
            lastIndexedAt: project.repo.indexStatus.lastIndexedAt,
            totalFiles: project.repo.indexStatus.totalFiles,
            totalChunks: project.repo.indexStatus.totalChunks,
          }
        : null,
    });
  } catch (error) {
    console.error("Check analysis availability error:", error);
    return NextResponse.json(
      { error: "Failed to check analysis availability" },
      { status: 500 }
    );
  }
}
