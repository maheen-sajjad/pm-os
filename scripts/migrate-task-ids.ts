/**
 * Migration script to backfill prefix for existing projects
 * and taskNumber for existing tasks.
 *
 * Run with: npx tsx scripts/migrate-task-ids.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function generateUniquePrefix(name: string, existingPrefixes: Set<string>): Promise<string> {
  // Extract first letters of each word (up to 4 letters)
  const words = name.trim().split(/\s+/).filter(Boolean);
  let basePrefix = words
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

  // If single word, take first 2-3 characters
  if (basePrefix.length < 2) {
    basePrefix = name.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3);
  }

  // If still empty, use "PRJ"
  if (!basePrefix) {
    basePrefix = "PRJ";
  }

  // Check if prefix exists
  if (!existingPrefixes.has(basePrefix)) {
    existingPrefixes.add(basePrefix);
    return basePrefix;
  }

  // Find next available numbered prefix
  let counter = 2;
  while (existingPrefixes.has(`${basePrefix}${counter}`)) {
    counter++;
  }

  const finalPrefix = `${basePrefix}${counter}`;
  existingPrefixes.add(finalPrefix);
  return finalPrefix;
}

async function main() {
  console.log("Starting migration...\n");

  // Get all projects without prefix
  const projectsWithoutPrefix = await prisma.project.findMany({
    where: { prefix: null },
    select: { id: true, name: true },
  });

  console.log(`Found ${projectsWithoutPrefix.length} projects without prefix`);

  // Get existing prefixes
  const existingPrefixRows = await prisma.project.findMany({
    where: { prefix: { not: null } },
    select: { prefix: true },
  });
  const existingPrefixes = new Set(existingPrefixRows.map((p) => p.prefix!));

  // Assign prefixes to projects
  for (const project of projectsWithoutPrefix) {
    const prefix = await generateUniquePrefix(project.name, existingPrefixes);
    await prisma.project.update({
      where: { id: project.id },
      data: { prefix },
    });
    console.log(`  Project "${project.name}" -> prefix: ${prefix}`);
  }

  console.log("\nAssigning task numbers...");

  // Get all projects and their tasks
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      prefix: true,
      nextTaskNumber: true,
      features: {
        select: {
          tasks: {
            where: { taskNumber: null },
            select: { id: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  for (const project of projects) {
    const tasks = project.features.flatMap((f) => f.tasks);
    if (tasks.length === 0) continue;

    console.log(`  Project "${project.name}" (${project.prefix}): ${tasks.length} tasks to number`);

    let nextNum = project.nextTaskNumber;
    for (const task of tasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: { taskNumber: nextNum },
      });
      nextNum++;
    }

    // Update project's nextTaskNumber
    await prisma.project.update({
      where: { id: project.id },
      data: { nextTaskNumber: nextNum },
    });
  }

  console.log("\nMigration complete!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
