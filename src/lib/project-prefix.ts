import prisma from "./prisma";

/**
 * Generates a unique prefix from a project name.
 * Takes first letters of each word, e.g., "User Dashboard" -> "UD"
 * If that prefix exists, appends numbers: "UD2", "UD3", etc.
 */
export async function generateUniquePrefix(name: string): Promise<string> {
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
  const existing = await prisma.project.findUnique({
    where: { prefix: basePrefix },
    select: { prefix: true },
  });

  if (!existing) {
    return basePrefix;
  }

  // Find next available numbered prefix
  const similarPrefixes = await prisma.project.findMany({
    where: {
      prefix: {
        startsWith: basePrefix,
      },
    },
    select: { prefix: true },
  });

  const existingSet = new Set(similarPrefixes.map((p) => p.prefix));
  let counter = 2;

  while (existingSet.has(`${basePrefix}${counter}`)) {
    counter++;
  }

  return `${basePrefix}${counter}`;
}
