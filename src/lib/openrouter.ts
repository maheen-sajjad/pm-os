import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "PM-OS",
  },
});

export type TaskCategory = "BACKEND" | "FRONTEND" | "DESIGN" | "QA" | "DEVOPS";

export interface ExtractedTask {
  title: string;
  category: TaskCategory;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface ExtractionResult {
  tasks: ExtractedTask[];
  summary?: string;
}

const EXTRACTION_PROMPT = `You are a technical project manager assistant. Analyze the following feature document and extract actionable development tasks.

For each task, determine:
1. A clear, concise task title (action-oriented, e.g., "Implement user authentication API")
2. Category: BACKEND, FRONTEND, DESIGN, QA, or DEVOPS
3. Priority: LOW, MEDIUM, HIGH, or URGENT (based on dependencies and importance)

Guidelines:
- Break down complex features into atomic, actionable tasks
- Each task should be completable by one developer in 1-3 days
- Include setup, implementation, testing, and documentation tasks where appropriate
- For UI features, include both design review and implementation tasks
- For API features, include endpoint implementation, validation, and error handling
- Include QA tasks for testing critical functionality

Return your response as a JSON object with this structure:
{
  "tasks": [
    { "title": "Task title here", "category": "BACKEND", "priority": "HIGH" }
  ],
  "summary": "Brief summary of what this feature does"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.`;

export async function extractTasksFromDocument(
  featureName: string,
  documentContent: string,
  model: string = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
): Promise<ExtractionResult> {
  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: EXTRACTION_PROMPT,
      },
      {
        role: "user",
        content: `Feature Name: ${featureName}\n\nFeature Document:\n${documentContent}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI model");
  }

  try {
    // Clean up potential markdown code blocks and extract JSON
    let cleanedContent = content
      .replace(/```json\n?/gi, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to extract JSON object if there's extra text around it
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    const result = JSON.parse(cleanedContent) as ExtractionResult;

    // Validate the structure
    if (!Array.isArray(result.tasks)) {
      throw new Error("Invalid response structure: tasks must be an array");
    }

    // Validate and normalize each task
    result.tasks = result.tasks.map((task) => ({
      title: String(task.title || "Untitled Task"),
      category: validateCategory(task.category),
      priority: validatePriority(task.priority),
    }));

    return result;
  } catch (parseError) {
    console.error("Failed to parse AI response:", content);
    console.error("Parse error:", parseError);

    // Fallback: try to extract any task-like patterns from the response
    const fallbackTasks: ExtractedTask[] = [];
    const taskPattern = /(?:^|\n)[-*•]\s*(.+?)(?:\s*\(([A-Z]+)\))?(?:\s*-\s*(LOW|MEDIUM|HIGH|URGENT))?$/gim;
    let match;

    while ((match = taskPattern.exec(content)) !== null) {
      fallbackTasks.push({
        title: match[1].trim(),
        category: validateCategory(match[2] || "BACKEND"),
        priority: validatePriority(match[3] || "MEDIUM"),
      });
    }

    if (fallbackTasks.length > 0) {
      console.log("Using fallback task extraction, found", fallbackTasks.length, "tasks");
      return { tasks: fallbackTasks, summary: "Tasks extracted via fallback parsing" };
    }

    throw new Error("Failed to parse AI response as JSON and fallback extraction found no tasks");
  }
}

function validateCategory(category: string): TaskCategory {
  const valid: TaskCategory[] = ["BACKEND", "FRONTEND", "DESIGN", "QA", "DEVOPS"];
  const upper = String(category).toUpperCase() as TaskCategory;
  return valid.includes(upper) ? upper : "BACKEND";
}

function validatePriority(priority: string): "LOW" | "MEDIUM" | "HIGH" | "URGENT" {
  const valid = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
  const upper = String(priority).toUpperCase() as typeof valid[number];
  return valid.includes(upper) ? upper : "MEDIUM";
}

// Knowledge Base Chat Types
export interface KBChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CodeContext {
  chunks: Array<{
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
  }>;
}

export interface KBChatContext {
  entries: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }>;
  code?: CodeContext;
}

export interface KBChatResponse {
  answer: string;
  sourcesUsed: string[];
  codeFilesUsed?: string[];
}

const KB_CHAT_SYSTEM_PROMPT = `You are a helpful project assistant with access to the project's knowledge base documentation AND source code.

Guidelines:
1. Answer based on the provided knowledge base entries AND/OR code snippets
2. If the information isn't in the context, say you don't have that information
3. For documentation questions, reference specific documents (e.g., "According to the Setup Guide...")
4. For code questions, reference specific files and line numbers (e.g., "In src/lib/auth.ts...")
5. When showing code, use proper markdown code blocks with language hints
6. Be concise but thorough
7. If multiple sources are relevant, synthesize the information
8. Use markdown formatting for better readability

When referencing sources:
- For KB entries: [Source: Entry Title]
- For code: [Code: path/to/file.ts:10-20]

Return your response as JSON with this structure:
{
  "answer": "Your detailed answer here with source citations",
  "sourcesUsed": ["entry-id-1", "entry-id-2"],
  "codeFilesUsed": ["path/to/file.ts", "path/to/other.ts"]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.`;

function getLanguageFromExtension(ext: string): string {
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    go: "go",
    java: "java",
    kt: "kotlin",
    rs: "rust",
    rb: "ruby",
    php: "php",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    css: "css",
    scss: "scss",
    less: "less",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sql: "sql",
    graphql: "graphql",
    prisma: "prisma",
  };
  return langMap[ext.toLowerCase()] || "";
}

export async function chatWithKnowledgeBase(
  messages: KBChatMessage[],
  context: KBChatContext,
  model: string = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
): Promise<KBChatResponse> {
  // Build context string from KB entries
  const kbContextStr = context.entries.length > 0
    ? context.entries
        .map(
          (e) =>
            `[ID: ${e.id}]\nTitle: ${e.title}\nCategory: ${e.category}\nContent:\n${e.content}\n---`
        )
        .join("\n\n")
    : "No knowledge base entries available.";

  // Build context string from code chunks
  let codeContextStr = "";
  if (context.code && context.code.chunks.length > 0) {
    codeContextStr = "\n\nSource Code Context:\n" + context.code.chunks
      .map((c) => {
        const ext = c.filePath.split(".").pop() || "";
        const lang = getLanguageFromExtension(ext);
        return `[File: ${c.filePath} (lines ${c.startLine}-${c.endLine})]\n\`\`\`${lang}\n${c.content}\n\`\`\`\n---`;
      })
      .join("\n\n");
  }

  const systemMessage =
    KB_CHAT_SYSTEM_PROMPT +
    "\n\nKnowledge Base Context:\n" +
    kbContextStr +
    codeContextStr;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: systemMessage,
      },
      ...messages.filter((m) => m.role !== "system"),
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI model");
  }

  try {
    // Clean up potential markdown code blocks
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleanedContent) as KBChatResponse;

    // Validate structure
    if (typeof result.answer !== "string") {
      throw new Error("Invalid response structure: answer must be a string");
    }

    // Ensure sourcesUsed is an array
    if (!Array.isArray(result.sourcesUsed)) {
      result.sourcesUsed = [];
    }

    // Ensure codeFilesUsed is an array if present
    if (result.codeFilesUsed && !Array.isArray(result.codeFilesUsed)) {
      result.codeFilesUsed = [];
    }

    return result;
  } catch (parseError) {
    // If JSON parsing fails, return the raw content as the answer
    console.error("Failed to parse KB chat response as JSON:", content);
    return {
      answer: content,
      sourcesUsed: context.entries.map((e) => e.id),
      codeFilesUsed: context.code?.chunks.map((c) => c.filePath) || [],
    };
  }
}

// ============== Project Intelligence Chat ==============

export interface ProjectChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ProjectContext {
  project: {
    id: string;
    name: string;
    prefix: string | null;
    description: string | null;
    status: string;
    lead: { id: string; name: string | null; email: string } | null;
    creator: { id: string; name: string | null; email: string };
    repo: {
      name: string;
      fullName: string;
      url: string;
      indexed: boolean;
      totalFiles: number;
    } | null;
  };
  stats: {
    totalTasks: number;
    byStatus: { BACKLOG: number; IN_PROGRESS: number; REVIEW: number; DONE: number };
    byCategory: { BACKEND: number; FRONTEND: number; DESIGN: number; QA: number; DEVOPS: number };
    byPriority: { URGENT: number; HIGH: number; MEDIUM: number; LOW: number };
    completionPercentage: number;
    tasksWithPRs: number;
    mergedPRs: number;
  };
  features: Array<{
    id: string;
    name: string;
    description: string | null;
    progress: number;
    tasks: Array<{
      id: string;
      taskNumber: number | null;
      title: string;
      description: string | null;
      status: string;
      category: string;
      priority: string;
      assignee: { name: string | null; email: string } | null;
      linkedPR: { number: number; title: string; url: string; status: string } | null;
      updatedAt: Date;
    }>;
  }>;
  codeChunks?: Array<{
    filePath: string;
    content: string;
    startLine: number;
    endLine: number;
  }>;
  kbEntries?: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
  }>;
}

export interface ProjectChatResponse {
  answer: string;
  sourcesUsed?: string[];
  codeFilesUsed?: string[];
  tasksMentioned?: string[];
}

const PROJECT_CHAT_SYSTEM_PROMPT = `You are an intelligent project management assistant for PM-OS. You have complete visibility into the project's tasks, features, progress, and optionally the codebase.

Your role is to help the team understand:
- **Progress**: What's done, in progress, or blocked
- **Status**: Overall project health and completion metrics
- **Blockers**: Tasks stuck in review, unassigned urgent tasks, stale items
- **Assignments**: Who's working on what
- **Code-Task Correlation**: Whether tasks appear implemented in the codebase (if indexed)

## Guidelines

1. **Be specific**: Reference tasks by their ID/number (e.g., "Task #5: Implement login API")
2. **Use data**: Cite completion percentages, task counts, and PR statuses
3. **Identify issues proactively**: Flag tasks in REVIEW too long, urgent unassigned tasks, etc.
4. **Cross-reference code**: If codebase is indexed and relevant code exists, mention if implementation appears complete
5. **Be concise**: Give direct answers, use bullet points for lists
6. **Use markdown**: Format responses for readability

## Task Status Meanings
- **BACKLOG**: Not started, waiting to be picked up
- **IN_PROGRESS**: Currently being worked on
- **REVIEW**: Code complete, awaiting review/merge
- **DONE**: Completed and verified

## PR Status Meanings
- **OPEN**: PR submitted, awaiting review
- **MERGED**: PR merged to main branch (strong signal task is done)
- **CLOSED**: PR closed without merge (may need investigation)

## Response Format

Return JSON:
{
  "answer": "Your detailed response with markdown formatting",
  "tasksMentioned": ["task-id-1", "task-id-2"],
  "codeFilesUsed": ["path/to/file.ts"],
  "sourcesUsed": ["kb-entry-id"]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks wrapping the JSON.`;

function buildProjectContextString(context: ProjectContext): string {
  const { project, stats, features } = context;

  let ctx = `## Project: ${project.name}
Status: ${project.status}
Lead: ${project.lead?.name || project.lead?.email || "Unassigned"}
${project.description ? `Description: ${project.description}` : ""}
${project.repo ? `Repository: ${project.repo.fullName} (${project.repo.indexed ? `indexed, ${project.repo.totalFiles} files` : "not indexed"})` : "No repository linked"}

## Progress Overview
- **Completion**: ${stats.completionPercentage}% (${stats.byStatus.DONE}/${stats.totalTasks} tasks)
- **In Progress**: ${stats.byStatus.IN_PROGRESS} tasks
- **In Review**: ${stats.byStatus.REVIEW} tasks
- **Backlog**: ${stats.byStatus.BACKLOG} tasks
- **PRs**: ${stats.tasksWithPRs} tasks have PRs, ${stats.mergedPRs} merged

## By Category
- Backend: ${stats.byCategory.BACKEND} | Frontend: ${stats.byCategory.FRONTEND} | Design: ${stats.byCategory.DESIGN} | QA: ${stats.byCategory.QA} | DevOps: ${stats.byCategory.DEVOPS}

## By Priority
- Urgent: ${stats.byPriority.URGENT} | High: ${stats.byPriority.HIGH} | Medium: ${stats.byPriority.MEDIUM} | Low: ${stats.byPriority.LOW}

## Features & Tasks
`;

  for (const feature of features) {
    const doneTasks = feature.tasks.filter((t) => t.status === "DONE").length;
    const featureProgress = feature.tasks.length > 0
      ? Math.round((doneTasks / feature.tasks.length) * 100)
      : 0;

    ctx += `\n### ${feature.name} (${featureProgress}% complete, ${feature.tasks.length} tasks)
${feature.description || ""}
`;

    for (const task of feature.tasks) {
      const taskId = task.taskNumber ? `#${task.taskNumber}` : task.id.slice(0, 8);
      const assignee = task.assignee?.name || task.assignee?.email || "Unassigned";
      const prInfo = task.linkedPR
        ? ` | PR #${task.linkedPR.number} (${task.linkedPR.status})`
        : "";

      ctx += `- [${task.status}] ${taskId}: ${task.title} (${task.category}, ${task.priority}) - ${assignee}${prInfo}\n`;
    }
  }

  // Add code context if available
  if (context.codeChunks && context.codeChunks.length > 0) {
    ctx += "\n## Relevant Code Snippets\n";
    for (const chunk of context.codeChunks) {
      const ext = chunk.filePath.split(".").pop() || "";
      const lang = getLanguageFromExtension(ext);
      ctx += `\n### ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine})\n\`\`\`${lang}\n${chunk.content}\n\`\`\`\n`;
    }
  }

  // Add KB context if available
  if (context.kbEntries && context.kbEntries.length > 0) {
    ctx += "\n## Knowledge Base References\n";
    for (const entry of context.kbEntries) {
      ctx += `\n### [${entry.id}] ${entry.title} (${entry.category})\n${entry.content.slice(0, 500)}${entry.content.length > 500 ? "..." : ""}\n`;
    }
  }

  return ctx;
}

export async function chatWithProjectContext(
  messages: ProjectChatMessage[],
  context: ProjectContext,
  model: string = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
): Promise<ProjectChatResponse> {
  const projectContextStr = buildProjectContextString(context);

  const systemMessage = PROJECT_CHAT_SYSTEM_PROMPT + "\n\n" + projectContextStr;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemMessage },
      ...messages.filter((m) => m.role !== "system"),
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI model");
  }

  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleanedContent) as ProjectChatResponse;

    if (typeof result.answer !== "string") {
      throw new Error("Invalid response structure: answer must be a string");
    }

    return {
      answer: result.answer,
      sourcesUsed: Array.isArray(result.sourcesUsed) ? result.sourcesUsed : [],
      codeFilesUsed: Array.isArray(result.codeFilesUsed) ? result.codeFilesUsed : [],
      tasksMentioned: Array.isArray(result.tasksMentioned) ? result.tasksMentioned : [],
    };
  } catch (parseError) {
    console.error("Failed to parse project chat response as JSON:", content);
    return {
      answer: content,
      sourcesUsed: context.kbEntries?.map((e) => e.id) || [],
      codeFilesUsed: context.codeChunks?.map((c) => c.filePath) || [],
      tasksMentioned: [],
    };
  }
}

// ============== Task Completion Analysis ==============

export type TaskStatus = "BACKLOG" | "IN_PROGRESS" | "REVIEW" | "DONE";

export interface TaskForAnalysis {
  id: string;
  taskNumber: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: string;
  priority: string;
  linkedPR: {
    number: number;
    title: string;
    status: string;
    branchName: string | null;
  } | null;
}

export interface CodeChunkForAnalysis {
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface TaskAnalysisResult {
  taskId: string;
  taskTitle: string;
  currentStatus: TaskStatus;
  suggestedStatus: TaskStatus;
  confidence: number; // 0-100
  reason: string;
  evidence: {
    prStatus?: string;
    codeFiles: string[];
  };
}

const TASK_ANALYSIS_PROMPT = `You are an AI assistant that analyzes whether development tasks appear to be complete based on CODE EVIDENCE from an indexed codebase.

## Your Task
Analyze the provided task against the code snippets to determine if the task has been implemented:
1. What status should this task have? (BACKLOG, IN_PROGRESS, REVIEW, DONE)
2. How confident are you in this assessment? (0-100)
3. What evidence supports your conclusion?

## CRITICAL: Code Evidence is Primary
The codebase has been indexed and relevant code snippets are provided. Your PRIMARY job is to determine if the code implements what the task describes. A task can be DONE even without a linked PR if the code is clearly implemented.

## Decision Guidelines

**DONE (Confidence 70-100):**
- Code snippets show CLEAR implementation of the task's requirements
- Files/functions exist that directly address the task (e.g., "Implement Web3Auth" → web3auth/ files exist with config, provider, hooks)
- API endpoints exist for API tasks, UI components exist for UI tasks
- The implementation appears functional and complete
- PR merged is BONUS evidence, but NOT required

**REVIEW (Confidence 50-70):**
- Code exists but might be incomplete or needs verification
- PR is OPEN awaiting review
- Implementation exists but unclear if fully meets requirements

**IN_PROGRESS (Confidence 30-50):**
- Only partial/skeleton implementation found
- Some related code exists but core functionality missing
- Files created but mostly empty or placeholder

**BACKLOG (Confidence 0-30):**
- NO relevant code snippets found at all
- Zero files related to the task
- Task topic not visible anywhere in the provided code

## Code Matching Rules
1. Match task keywords to file paths (e.g., "web3auth" task → files in /web3auth/ = strong match)
2. Match task intent to code functionality (e.g., "authentication" → login/auth related code)
3. API tasks → look for route handlers, endpoints
4. UI tasks → look for React components, pages
5. If multiple code files clearly implement the feature → likely DONE

## Examples
- Task "Implement authentication via Web3Auth" + Code shows /web3auth/config.ts, provider.tsx, hooks = DONE (90%)
- Task "Create earnings dashboard" + Code shows /earnings/page.tsx with charts = DONE (85%)
- Task "Add file upload" + Code shows FileUploadPanel.tsx, FileUploadButton.tsx = DONE (85%)
- Task "Implement marketplace listing" + Code shows /marketplace/page.tsx, ListingCard.tsx = DONE (85%)
- Task "Add payment processing" + No payment-related code found = BACKLOG (10%)

## Response Format
Return JSON:
{
  "suggestedStatus": "DONE" | "REVIEW" | "IN_PROGRESS" | "BACKLOG",
  "confidence": <number 0-100>,
  "reason": "Brief explanation citing specific files/evidence",
  "codeFiles": ["list", "of", "relevant", "files"]
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`;

export async function analyzeTaskCompletion(
  task: TaskForAnalysis,
  codeChunks: CodeChunkForAnalysis[],
  model: string = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
): Promise<TaskAnalysisResult> {
  // Build task context
  const taskContext = `## Task to Analyze
ID: ${task.taskNumber ? `#${task.taskNumber}` : task.id}
Title: ${task.title}
Description: ${task.description || "No description"}
Current Status: ${task.status}
Category: ${task.category}
Priority: ${task.priority}

## Linked Pull Request
${task.linkedPR
  ? `PR #${task.linkedPR.number}: ${task.linkedPR.title}
Status: ${task.linkedPR.status}
Branch: ${task.linkedPR.branchName || "unknown"}`
  : "No PR linked to this task"}

## Code Evidence (${codeChunks.length} relevant snippets found)
${codeChunks.length > 0
  ? codeChunks.map(chunk => {
      const ext = chunk.filePath.split(".").pop() || "";
      const lang = getLanguageFromExtension(ext);
      return `### ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine})
\`\`\`${lang}
${chunk.content}
\`\`\``;
    }).join("\n\n")
  : "No relevant code snippets found in the indexed codebase."}`;

  const response = await openrouter.chat.completions.create({
    model,
    messages: [
      { role: "system", content: TASK_ANALYSIS_PROMPT },
      { role: "user", content: taskContext },
    ],
    temperature: 0.2, // Low temperature for consistent analysis
    max_tokens: 1024,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No response from AI model");
  }

  try {
    const cleanedContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const result = JSON.parse(cleanedContent);

    // Validate and normalize response
    const validStatuses: TaskStatus[] = ["BACKLOG", "IN_PROGRESS", "REVIEW", "DONE"];
    const suggestedStatus = validStatuses.includes(result.suggestedStatus?.toUpperCase())
      ? (result.suggestedStatus.toUpperCase() as TaskStatus)
      : task.status; // Keep current if invalid

    const confidence = typeof result.confidence === "number"
      ? Math.max(0, Math.min(100, result.confidence))
      : 50;

    return {
      taskId: task.id,
      taskTitle: task.title,
      currentStatus: task.status,
      suggestedStatus,
      confidence,
      reason: String(result.reason || "Analysis completed"),
      evidence: {
        prStatus: task.linkedPR?.status,
        codeFiles: Array.isArray(result.codeFiles) ? result.codeFiles : [],
      },
    };
  } catch (parseError) {
    console.error("Failed to parse task analysis response:", content);

    // Fallback: infer from PR status if available
    let fallbackStatus = task.status;
    let fallbackConfidence = 30;
    let fallbackReason = "Could not parse AI response, using PR status heuristic";

    if (task.linkedPR) {
      if (task.linkedPR.status === "MERGED") {
        fallbackStatus = "DONE";
        fallbackConfidence = 70;
        fallbackReason = "PR is merged - task likely complete";
      } else if (task.linkedPR.status === "OPEN") {
        fallbackStatus = "REVIEW";
        fallbackConfidence = 60;
        fallbackReason = "PR is open - task in review";
      }
    }

    return {
      taskId: task.id,
      taskTitle: task.title,
      currentStatus: task.status,
      suggestedStatus: fallbackStatus,
      confidence: fallbackConfidence,
      reason: fallbackReason,
      evidence: {
        prStatus: task.linkedPR?.status,
        codeFiles: codeChunks.map(c => c.filePath),
      },
    };
  }
}

// Batch analyze multiple tasks
export async function analyzeMultipleTasks(
  tasks: TaskForAnalysis[],
  codeChunksByTask: Map<string, CodeChunkForAnalysis[]>,
  model?: string
): Promise<TaskAnalysisResult[]> {
  const results: TaskAnalysisResult[] = [];

  // Process sequentially to avoid rate limiting
  for (const task of tasks) {
    const chunks = codeChunksByTask.get(task.id) || [];
    try {
      const result = await analyzeTaskCompletion(task, chunks, model);
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze task ${task.id}:`, error);
      // Add a failed result
      results.push({
        taskId: task.id,
        taskTitle: task.title,
        currentStatus: task.status,
        suggestedStatus: task.status,
        confidence: 0,
        reason: "Analysis failed - keeping current status",
        evidence: { codeFiles: [] },
      });
    }
  }

  return results;
}

export default openrouter;
