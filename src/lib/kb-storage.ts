import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const KB_UPLOAD_DIR = process.env.KB_UPLOAD_DIR || "./public/uploads/kb";
const KB_MAX_FILE_SIZE_MB = parseInt(process.env.KB_MAX_FILE_SIZE_MB || "25", 10);
const KB_ALLOWED_FILE_TYPES = (
  process.env.KB_ALLOWED_FILE_TYPES ||
  "pdf,png,jpg,jpeg,gif,webp,svg,doc,docx,xls,xlsx,txt,md"
)
  .split(",")
  .map((t) => t.trim().toLowerCase());

export const KB_MAX_FILE_SIZE_BYTES = KB_MAX_FILE_SIZE_MB * 1024 * 1024;

export function isAllowedFileType(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return KB_ALLOWED_FILE_TYPES.includes(ext);
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

export async function ensureUploadDir(projectId: string, entryId: string): Promise<string> {
  const uploadPath = path.join(KB_UPLOAD_DIR, projectId, entryId);

  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true });
  }

  return uploadPath;
}

export async function saveFile(
  file: File,
  projectId: string,
  entryId: string
): Promise<{ fileName: string; storagePath: string; fileSize: number; fileType: string }> {
  const uploadDir = await ensureUploadDir(projectId, entryId);

  const ext = getFileExtension(file.name);
  const uniqueFileName = `${uuidv4()}.${ext}`;
  const filePath = path.join(uploadDir, uniqueFileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Return the public URL path
  const storagePath = `/uploads/kb/${projectId}/${entryId}/${uniqueFileName}`;

  return {
    fileName: file.name,
    storagePath,
    fileSize: file.size,
    fileType: file.type || `application/${ext}`,
  };
}

export async function deleteFile(storagePath: string): Promise<void> {
  // Convert public URL path to file system path
  const fsPath = path.join("./public", storagePath);

  if (existsSync(fsPath)) {
    await unlink(fsPath);
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > KB_MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${KB_MAX_FILE_SIZE_MB}MB`,
    };
  }

  if (!isAllowedFileType(file.name)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${KB_ALLOWED_FILE_TYPES.join(", ")}`,
    };
  }

  return { valid: true };
}
