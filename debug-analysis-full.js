const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Code file extensions
const CODE_EXTENSIONS = new Set([
  "ts", "tsx", "js", "jsx", "py", "go", "java", "kt", "rs", "rb", "php",
  "c", "cpp", "h", "hpp", "cs", "swift", "vue", "svelte", "prisma", "graphql",
]);

const EXCLUDE_PATTERNS = [
  /readme/i, /\.md$/i, /setup/i, /deployment/i, /\.json$/i, /\.yaml$/i,
  /\.yml$/i, /\.config\./i, /\.env/i, /license/i, /changelog/i,
];

function isSourceCodeFile(filePath) {
  if (EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath))) {
    return false;
  }
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  return CODE_EXTENSIONS.has(ext);
}

function extractTaskKeywords(task) {
  const text = `${task.title} ${task.description || ""}`;
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "as", "into", "through", "this", "that", "and", "or", "but",
    "should", "must", "will", "can", "need", "needs", "have", "has",
    "task", "feature", "functionality", "component", "system",
  ]);

  const technicalTerms = text.match(/\b[a-zA-Z0-9]+(?:[A-Z][a-z]+)+\b|\b\w+(?:auth|nft|api|sdk|ui|db)\b/gi) || [];
  const splitCamelCase = text.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  const baseWords = splitCamelCase
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const combinedKeywords = [
    ...technicalTerms.map((t) => t.toLowerCase()),
    ...baseWords,
  ];
  const allKeywords = Array.from(new Set(combinedKeywords));

  const actionKeywords = allKeywords.filter((w) =>
    !["implement", "add", "create", "update", "fix", "build", "develop", "design", "set"].includes(w)
  );

  return actionKeywords.length > 0 ? actionKeywords : allKeywords;
}

async function searchCodeChunksForTask(repoId, keywords) {
  if (keywords.length === 0) return { pathChunks: [], contentChunks: [], combinedScored: [] };

  const searchKeywords = keywords.slice(0, 5);
  console.log(`  Searching with keywords: ${searchKeywords.join(', ')}`);

  // Stage 1: Search by file path matches
  const filePathConditions = searchKeywords.map((keyword) => ({
    filePath: { contains: keyword, mode: "insensitive" },
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

  console.log(`  Stage 1 (path match): ${pathMatchChunks.length} chunks`);

  // Stage 2: Search by content/keywords
  const contentConditions = searchKeywords.flatMap((keyword) => [
    { keywords: { contains: keyword, mode: "insensitive" } },
    { content: { contains: keyword, mode: "insensitive" } },
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

  console.log(`  Stage 2 (content match): ${contentMatchChunks.length} chunks`);

  // Combine and deduplicate
  const seenIds = new Set();
  const allChunks = [...pathMatchChunks, ...contentMatchChunks].filter((chunk) => {
    if (seenIds.has(chunk.id)) return false;
    seenIds.add(chunk.id);
    return true;
  });

  console.log(`  Combined unique chunks: ${allChunks.length}`);

  // Score and rank
  const scored = allChunks.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const keywordsLower = (chunk.keywords || "").toLowerCase();
    const filePathLower = chunk.file.filePath.toLowerCase();
    const isCode = isSourceCodeFile(chunk.file.filePath);

    for (const kw of searchKeywords) {
      const kwLower = kw.toLowerCase();
      if (keywordsLower.includes(kwLower)) score += 3;
      if (contentLower.includes(kwLower)) score += 1;
      if (filePathLower.includes(kwLower)) score += 5;
    }

    if (isCode) {
      score *= 3;
      if (contentLower.includes("export") || contentLower.includes("function") ||
          contentLower.includes("class") || contentLower.includes("async")) {
        score += 10;
      }
      if (filePathLower.includes("/api/") || filePathLower.includes("route")) {
        score += 15;
      }
    } else {
      score = Math.floor(score / 4);
    }

    return {
      filePath: chunk.file.filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      score,
      isCode,
    };
  });

  const sorted = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => {
      if (a.isCode && !b.isCode) return -1;
      if (!a.isCode && b.isCode) return 1;
      return b.score - a.score;
    });

  return {
    pathChunks: pathMatchChunks.map(c => c.file.filePath),
    contentChunks: contentMatchChunks.map(c => c.file.filePath),
    combinedScored: sorted.slice(0, 10),
  };
}

async function main() {
  const projectId = 'cmj670o0j00bs5wvg53p4myv1';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      repo: true,
      features: {
        include: {
          tasks: {
            where: { status: { not: "DONE" } },
            orderBy: { taskNumber: 'asc' }
          }
        }
      }
    }
  });

  if (!project || !project.repo) {
    console.log('Project or repo not found');
    return;
  }

  console.log(`Project: ${project.name}`);
  console.log(`Repo ID: ${project.repo.id}`);
  console.log(`\n${'='.repeat(80)}\n`);

  // Analyze first few tasks
  const allTasks = project.features.flatMap(f => f.tasks).slice(0, 5);

  for (const task of allTasks) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TASK: ${task.title}`);
    console.log(`Current Status: ${task.status}`);
    console.log(`Description: ${task.description || 'none'}`);
    console.log(`${'='.repeat(80)}`);

    const keywords = extractTaskKeywords(task);
    console.log(`\nExtracted Keywords: ${keywords.join(', ')}`);

    const searchResults = await searchCodeChunksForTask(project.repo.id, keywords);

    console.log(`\n--- Path Match Files ---`);
    const uniquePaths = [...new Set(searchResults.pathChunks)];
    uniquePaths.forEach(f => console.log(`  ${f}`));

    console.log(`\n--- Content Match Files ---`);
    const uniqueContent = [...new Set(searchResults.contentChunks)];
    uniqueContent.slice(0, 10).forEach(f => console.log(`  ${f}`));

    console.log(`\n--- Top Scored Results (sent to AI) ---`);
    searchResults.combinedScored.forEach((r, i) => {
      console.log(`  ${i+1}. [Score: ${r.score}] ${r.isCode ? '✓CODE' : '✗DOC '} ${r.filePath}:${r.startLine}-${r.endLine}`);
    });

    if (searchResults.combinedScored.length === 0) {
      console.log(`  ⚠️  NO CODE FOUND - AI will suggest keeping BACKLOG`);
    } else if (searchResults.combinedScored.filter(r => r.isCode).length === 0) {
      console.log(`  ⚠️  NO SOURCE CODE FILES - Only documentation found`);
    }
  }

  // Also show what files ARE indexed that might be relevant
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('ALL INDEXED SOURCE CODE FILES:');
  console.log('='.repeat(80));

  const allFiles = await prisma.codeFile.findMany({
    where: { repoId: project.repo.id },
    orderBy: { filePath: 'asc' }
  });

  const codeFiles = allFiles.filter(f => isSourceCodeFile(f.filePath));
  codeFiles.forEach(f => console.log(f.filePath));
  console.log(`\nTotal indexed files: ${allFiles.length}`);
  console.log(`Source code files: ${codeFiles.length}`);
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
