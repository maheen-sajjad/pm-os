const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  // Get the repo
  const repo = await prisma.gitHubRepo.findFirst({
    where: { fullName: 'javeriapervaiz-debug/Inflectiv-recreation' }
  });

  if (!repo) {
    console.log('Repo not found');
    return;
  }

  // Get indexed files
  const files = await prisma.codeFile.findMany({
    where: { repoId: repo.id },
    orderBy: { filePath: 'asc' }
  });

  console.log('=== INDEXED FILES ===');
  console.log('Total files:', files.length);
  files.forEach(f => console.log(f.filePath));

  // Sample some code chunks with keywords
  console.log('\n=== SAMPLE CODE CHUNKS ===');
  const chunks = await prisma.codeChunk.findMany({
    where: { file: { repoId: repo.id } },
    take: 10,
    include: { file: { select: { filePath: true } } }
  });

  chunks.forEach(chunk => {
    console.log(`\n--- ${chunk.file.filePath}:${chunk.startLine}-${chunk.endLine} ---`);
    console.log('Keywords:', chunk.keywords.join(', '));
    console.log('Content preview:', chunk.content.substring(0, 200) + '...');
  });

  // Search for earnings-related chunks
  console.log('\n=== EARNINGS RELATED CHUNKS ===');
  const earningsChunks = await prisma.codeChunk.findMany({
    where: {
      file: { repoId: repo.id },
      OR: [
        { keywords: { hasSome: ['earnings', 'tracking', 'revenue'] } },
        { content: { contains: 'earnings', mode: 'insensitive' } }
      ]
    },
    include: { file: { select: { filePath: true } } }
  });

  console.log('Found', earningsChunks.length, 'earnings-related chunks');
  earningsChunks.slice(0, 3).forEach(chunk => {
    console.log(`\n${chunk.file.filePath}:${chunk.startLine}-${chunk.endLine}`);
    console.log('Keywords:', chunk.keywords.join(', '));
  });

  // Search for authentication-related chunks
  console.log('\n=== AUTH RELATED CHUNKS ===');
  const authChunks = await prisma.codeChunk.findMany({
    where: {
      file: { repoId: repo.id },
      OR: [
        { keywords: { hasSome: ['auth', 'authentication', 'web3auth', 'login'] } },
        { content: { contains: 'auth', mode: 'insensitive' } }
      ]
    },
    include: { file: { select: { filePath: true } } }
  });

  console.log('Found', authChunks.length, 'auth-related chunks');
  authChunks.slice(0, 3).forEach(chunk => {
    console.log(`\n${chunk.file.filePath}:${chunk.startLine}-${chunk.endLine}`);
    console.log('Keywords:', chunk.keywords.join(', '));
  });
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
