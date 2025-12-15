import { prisma } from "@/lib/prisma";
import { getRepoTree, getFileContent, getLatestCommitSha } from "@/lib/github";
import {
  shouldIndexFile,
  getFileType,
  chunkCodeFile,
  extractCodeKeywords,
  getExtension,
  getFileName,
} from "@/lib/codeIndexer";

export interface IndexResult {
  success: boolean;
  filesIndexed: number;
  chunksCreated: number;
  filesSkipped: number;
  errors: string[];
}

interface IndexProgress {
  current: number;
  total: number;
  currentFile: string;
}

// Delay between file fetches to avoid rate limiting
const FETCH_DELAY_MS = 100;

/**
 * Main function to index a repository's codebase
 */
export async function indexCodebase(
  repoId: string,
  accessToken: string,
  owner: string,
  repoName: string,
  onProgress?: (progress: IndexProgress) => void
): Promise<IndexResult> {
  const result: IndexResult = {
    success: false,
    filesIndexed: 0,
    chunksCreated: 0,
    filesSkipped: 0,
    errors: [],
  };

  try {
    // Mark indexing as in progress
    await prisma.codeIndexStatus.upsert({
      where: { repoId },
      create: {
        repoId,
        indexingInProgress: true,
        lastError: null,
      },
      update: {
        indexingInProgress: true,
        lastError: null,
      },
    });

    // Get latest commit SHA for change detection
    const latestCommitSha = await getLatestCommitSha(accessToken, owner, repoName);

    // Get existing index status
    const existingStatus = await prisma.codeIndexStatus.findUnique({
      where: { repoId },
    });

    // If same commit, skip re-indexing
    if (existingStatus?.lastCommitSha === latestCommitSha) {
      await prisma.codeIndexStatus.update({
        where: { repoId },
        data: { indexingInProgress: false },
      });
      result.success = true;
      return result;
    }

    // Get all files in the repository
    const tree = await getRepoTree(accessToken, owner, repoName);

    // Filter to indexable files
    const filesToIndex = tree.filter((item) => shouldIndexFile(item.path, item.size));
    const totalFiles = filesToIndex.length;

    // Get existing files to check for changes
    const existingFiles = await prisma.codeFile.findMany({
      where: { repoId },
      select: { id: true, filePath: true, sha: true },
    });
    const existingFileMap = new Map(existingFiles.map((f) => [f.filePath, f]));

    // Track processed file paths
    const processedPaths = new Set<string>();

    // Process each file
    for (let i = 0; i < filesToIndex.length; i++) {
      const file = filesToIndex[i];
      processedPaths.add(file.path);

      if (onProgress) {
        onProgress({
          current: i + 1,
          total: totalFiles,
          currentFile: file.path,
        });
      }

      try {
        const existing = existingFileMap.get(file.path);

        // Skip if file hasn't changed
        if (existing && existing.sha === file.sha) {
          result.filesSkipped++;
          continue;
        }

        // Fetch file content
        const fileContent = await getFileContent(accessToken, owner, repoName, file.path);

        // Chunk the file
        const chunks = chunkCodeFile(fileContent.content);

        // Determine file type
        const fileType = getFileType(file.path);

        // Create or update file record with chunks
        if (existing) {
          // Delete existing chunks
          await prisma.codeChunk.deleteMany({
            where: { fileId: existing.id },
          });

          // Update file
          await prisma.codeFile.update({
            where: { id: existing.id },
            data: {
              sha: file.sha,
              sizeBytes: fileContent.size,
              fileType,
              updatedAt: new Date(),
            },
          });

          // Create new chunks
          await prisma.codeChunk.createMany({
            data: chunks.map((chunk) => ({
              fileId: existing.id,
              content: chunk.content,
              startLine: chunk.startLine,
              endLine: chunk.endLine,
              chunkIndex: chunk.chunkIndex,
              keywords: extractCodeKeywords(chunk.content, file.path),
            })),
          });

          result.chunksCreated += chunks.length;
        } else {
          // Create new file with chunks
          const newFile = await prisma.codeFile.create({
            data: {
              repoId,
              filePath: file.path,
              fileName: getFileName(file.path),
              extension: getExtension(file.path),
              fileType,
              sha: file.sha,
              sizeBytes: fileContent.size,
              chunks: {
                create: chunks.map((chunk) => ({
                  content: chunk.content,
                  startLine: chunk.startLine,
                  endLine: chunk.endLine,
                  chunkIndex: chunk.chunkIndex,
                  keywords: extractCodeKeywords(chunk.content, file.path),
                })),
              },
            },
          });

          result.chunksCreated += chunks.length;
        }

        result.filesIndexed++;

        // Small delay to avoid rate limiting
        if (FETCH_DELAY_MS > 0 && i < filesToIndex.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, FETCH_DELAY_MS));
        }
      } catch (fileError: any) {
        result.errors.push(`Error processing ${file.path}: ${fileError.message}`);
      }
    }

    // Delete files that no longer exist in repo
    const deletedPaths = existingFiles
      .filter((f) => !processedPaths.has(f.filePath))
      .map((f) => f.id);

    if (deletedPaths.length > 0) {
      await prisma.codeFile.deleteMany({
        where: { id: { in: deletedPaths } },
      });
    }

    // Get total counts
    const totalCounts = await prisma.codeFile.aggregate({
      where: { repoId },
      _count: { id: true },
    });

    const chunkCounts = await prisma.codeChunk.aggregate({
      where: { file: { repoId } },
      _count: { id: true },
    });

    // Update index status
    await prisma.codeIndexStatus.update({
      where: { repoId },
      data: {
        indexingInProgress: false,
        lastIndexedAt: new Date(),
        lastCommitSha: latestCommitSha,
        totalFiles: totalCounts._count.id,
        totalChunks: chunkCounts._count.id,
        lastError: result.errors.length > 0 ? result.errors.join("\n") : null,
      },
    });

    result.success = true;
  } catch (error: any) {
    // Update status with error
    await prisma.codeIndexStatus.upsert({
      where: { repoId },
      create: {
        repoId,
        indexingInProgress: false,
        lastError: error.message,
      },
      update: {
        indexingInProgress: false,
        lastError: error.message,
      },
    });

    result.errors.push(error.message);
  }

  return result;
}

/**
 * Get the current index status for a repository
 */
export async function getIndexStatus(repoId: string) {
  const status = await prisma.codeIndexStatus.findUnique({
    where: { repoId },
  });

  if (!status) {
    return {
      indexed: false,
      lastIndexedAt: null,
      totalFiles: 0,
      totalChunks: 0,
      inProgress: false,
      lastError: null,
    };
  }

  return {
    indexed: status.lastIndexedAt !== null,
    lastIndexedAt: status.lastIndexedAt,
    totalFiles: status.totalFiles,
    totalChunks: status.totalChunks,
    inProgress: status.indexingInProgress,
    lastError: status.lastError,
  };
}

/**
 * Clear the index for a repository
 */
export async function clearCodeIndex(repoId: string): Promise<void> {
  // Delete all code files (chunks cascade)
  await prisma.codeFile.deleteMany({
    where: { repoId },
  });

  // Reset index status
  await prisma.codeIndexStatus.upsert({
    where: { repoId },
    create: { repoId },
    update: {
      lastIndexedAt: null,
      lastCommitSha: null,
      totalFiles: 0,
      totalChunks: 0,
      indexingInProgress: false,
      lastError: null,
    },
  });
}
