const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const projectId = 'cmj670o0j00bs5wvg53p4myv1';

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { repo: true }
  });

  if (!project || !project.repo) {
    console.log('Project or repo not found');
    return;
  }

  console.log('=== DIRECT SEARCH: web3auth ===\n');

  // Direct search for web3auth in file path
  const web3authChunks = await prisma.codeChunk.findMany({
    where: {
      file: {
        repoId: project.repo.id,
        filePath: { contains: 'web3auth', mode: 'insensitive' }
      }
    },
    include: { file: { select: { filePath: true } } },
    take: 10,
  });

  console.log(`Chunks from web3auth files: ${web3authChunks.length}`);
  web3authChunks.forEach(c => {
    console.log(`  - ${c.file.filePath}:${c.startLine}-${c.endLine}`);
    console.log(`    Content preview: ${c.content.substring(0, 100).replace(/\n/g, ' ')}...`);
  });

  console.log('\n=== DIRECT SEARCH: earnings API ===\n');

  const earningsChunks = await prisma.codeChunk.findMany({
    where: {
      file: {
        repoId: project.repo.id,
        filePath: { contains: 'earnings', mode: 'insensitive' }
      }
    },
    include: { file: { select: { filePath: true } } },
    take: 10,
  });

  console.log(`Chunks from earnings files: ${earningsChunks.length}`);
  earningsChunks.forEach(c => {
    console.log(`  - ${c.file.filePath}:${c.startLine}-${c.endLine}`);
  });

  console.log('\n=== DIRECT SEARCH: marketplace ===\n');

  const marketplaceChunks = await prisma.codeChunk.findMany({
    where: {
      file: {
        repoId: project.repo.id,
        filePath: { contains: 'marketplace', mode: 'insensitive' }
      }
    },
    include: { file: { select: { filePath: true } } },
    take: 10,
  });

  console.log(`Chunks from marketplace files: ${marketplaceChunks.length}`);
  marketplaceChunks.forEach(c => {
    console.log(`  - ${c.file.filePath}:${c.startLine}-${c.endLine}`);
  });

  console.log('\n=== DIRECT SEARCH: minting ===\n');

  const mintingChunks = await prisma.codeChunk.findMany({
    where: {
      file: {
        repoId: project.repo.id,
        filePath: { contains: 'mint', mode: 'insensitive' }
      }
    },
    include: { file: { select: { filePath: true } } },
    take: 10,
  });

  console.log(`Chunks from minting files: ${mintingChunks.length}`);
  mintingChunks.forEach(c => {
    console.log(`  - ${c.file.filePath}:${c.startLine}-${c.endLine}`);
  });
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  pool.end();
});
