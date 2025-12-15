import type { CodeFileType } from "@prisma/client";

// File extensions to index
const INDEXABLE_EXTENSIONS = new Set([
  // JavaScript/TypeScript
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  // Python
  ".py",
  // Go
  ".go",
  // Java/Kotlin
  ".java", ".kt",
  // C/C++
  ".c", ".cpp", ".h", ".hpp",
  // Rust
  ".rs",
  // Ruby
  ".rb",
  // PHP
  ".php",
  // Config
  ".json", ".yaml", ".yml", ".toml",
  // Docs
  ".md", ".mdx",
  // Styles
  ".css", ".scss", ".less",
  // Other
  ".sql", ".graphql", ".prisma", ".env.example",
]);

// Paths to always ignore
const IGNORE_PATTERNS = [
  /^node_modules\//,
  /^\.git\//,
  /^\.next\//,
  /^dist\//,
  /^build\//,
  /^coverage\//,
  /^\.cache\//,
  /^vendor\//,
  /^__pycache__\//,
  /\.min\.js$/,
  /\.min\.css$/,
  /\.bundle\.js$/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /\.map$/,
  /\.d\.ts$/,  // TypeScript declaration files
];

// Max file size to index (100KB)
const MAX_FILE_SIZE = 100 * 1024;

// Chunking constants
const CHUNK_TARGET_LINES = 50;
const CHUNK_MAX_LINES = 100;
const CHUNK_MIN_LINES = 10;

// Programming-specific stop words to ignore
const CODE_STOP_WORDS = new Set([
  // JavaScript/TypeScript keywords
  "const", "let", "var", "function", "return", "if", "else", "for",
  "while", "class", "interface", "type", "import", "export", "from",
  "default", "async", "await", "new", "this", "true", "false", "null",
  "undefined", "void", "string", "number", "boolean", "any", "object",
  "public", "private", "protected", "static", "readonly", "extends",
  "implements", "constructor", "super", "try", "catch", "throw", "finally",
  "typeof", "instanceof", "switch", "case", "break", "continue", "do",
  // Python keywords
  "def", "lambda", "self", "cls", "none", "and", "not", "with", "as",
  "pass", "raise", "except", "finally", "yield", "global", "nonlocal",
  // Common generic terms
  "get", "set", "data", "value", "item", "items", "list", "array",
  "index", "key", "keys", "name", "id", "ids", "param", "params",
  "arg", "args", "result", "results", "error", "errors", "message",
  "response", "request", "callback", "handler", "event", "props",
]);

/**
 * Determine if a file should be indexed
 */
export function shouldIndexFile(path: string, size?: number): boolean {
  // Check size
  if (size && size > MAX_FILE_SIZE) return false;

  // Check ignore patterns
  if (IGNORE_PATTERNS.some((pattern) => pattern.test(path))) return false;

  // Check extension
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  return INDEXABLE_EXTENSIONS.has(ext);
}

/**
 * Determine the file type category
 */
export function getFileType(path: string): CodeFileType {
  const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
  const fileName = path.split("/").pop() || "";

  // Config files
  if (
    ext === ".json" ||
    ext === ".yaml" ||
    ext === ".yml" ||
    ext === ".toml" ||
    fileName.startsWith(".") ||
    fileName.includes("config") ||
    fileName === "package.json" ||
    fileName === "tsconfig.json"
  ) {
    return "CONFIG";
  }

  // Documentation
  if (ext === ".md" || ext === ".mdx" || fileName.toLowerCase().includes("readme")) {
    return "DOCS";
  }

  // Styles
  if (ext === ".css" || ext === ".scss" || ext === ".less") {
    return "STYLE";
  }

  // Source code
  if (
    ext === ".ts" ||
    ext === ".tsx" ||
    ext === ".js" ||
    ext === ".jsx" ||
    ext === ".py" ||
    ext === ".go" ||
    ext === ".java" ||
    ext === ".rs" ||
    ext === ".rb" ||
    ext === ".php" ||
    ext === ".c" ||
    ext === ".cpp"
  ) {
    return "SOURCE";
  }

  return "OTHER";
}

export interface CodeChunkData {
  content: string;
  startLine: number;
  endLine: number;
  chunkIndex: number;
}

/**
 * Split a code file into chunks for indexing
 */
export function chunkCodeFile(content: string): CodeChunkData[] {
  const lines = content.split("\n");
  const chunks: CodeChunkData[] = [];

  // For small files, keep as single chunk
  if (lines.length <= CHUNK_MAX_LINES) {
    return [
      {
        content,
        startLine: 1,
        endLine: lines.length,
        chunkIndex: 0,
      },
    ];
  }

  // For larger files, split intelligently
  let currentChunkStart = 0;
  let chunkIndex = 0;

  while (currentChunkStart < lines.length) {
    let chunkEnd = Math.min(currentChunkStart + CHUNK_TARGET_LINES, lines.length);

    // Try to find a natural break point (empty line, closing brace, etc.)
    if (chunkEnd < lines.length) {
      const searchStart = currentChunkStart + CHUNK_MIN_LINES;
      const searchEnd = Math.min(currentChunkStart + CHUNK_MAX_LINES, lines.length);

      for (let i = chunkEnd; i < searchEnd; i++) {
        const line = lines[i].trim();
        if (line === "" || line === "}" || line === "};" || line === "};") {
          chunkEnd = i + 1;
          break;
        }
      }
    }

    const chunkContent = lines.slice(currentChunkStart, chunkEnd).join("\n");

    chunks.push({
      content: chunkContent,
      startLine: currentChunkStart + 1, // 1-indexed
      endLine: chunkEnd,
      chunkIndex,
    });

    currentChunkStart = chunkEnd;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Split a camelCase or PascalCase string into words
 */
function splitCamelCase(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s_-]+/)
    .filter((s) => s.length > 0);
}

/**
 * Extract searchable keywords from code content
 */
export function extractCodeKeywords(content: string, filePath: string): string {
  const keywords = new Set<string>();

  // Add filename parts
  const fileName = filePath.split("/").pop() || "";
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
  splitCamelCase(nameWithoutExt).forEach((word) => {
    if (word.length > 2) keywords.add(word.toLowerCase());
  });

  // Add directory names from path (often meaningful)
  const pathParts = filePath.split("/").slice(0, -1);
  pathParts.forEach((part) => {
    if (part.length > 2 && !part.startsWith(".")) {
      keywords.add(part.toLowerCase());
    }
  });

  // Extract identifiers from code
  const identifierPattern = /\b([a-zA-Z_][a-zA-Z0-9_]{2,})\b/g;
  let match;
  while ((match = identifierPattern.exec(content)) !== null) {
    const word = match[1].toLowerCase();
    if (!CODE_STOP_WORDS.has(word) && word.length > 2) {
      keywords.add(word);
      // Also add camelCase parts
      splitCamelCase(match[1]).forEach((part) => {
        if (part.length > 2 && !CODE_STOP_WORDS.has(part.toLowerCase())) {
          keywords.add(part.toLowerCase());
        }
      });
    }
  }

  // Extract string literals (for important constants like route paths, event names)
  const stringPattern = /["'`]([a-zA-Z_][a-zA-Z0-9_/-]{3,})["'`]/g;
  while ((match = stringPattern.exec(content)) !== null) {
    const str = match[1];
    // Skip URLs and paths that are too long
    if (str.length < 50 && !str.includes("://")) {
      keywords.add(str.toLowerCase());
    }
  }

  // Limit keywords to prevent excessive storage
  const keywordArray = Array.from(keywords);
  if (keywordArray.length > 100) {
    return keywordArray.slice(0, 100).join(" ");
  }

  return keywordArray.join(" ");
}

/**
 * Get file extension from path
 */
export function getExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) return "";
  return path.slice(lastDot).toLowerCase();
}

/**
 * Get filename from path
 */
export function getFileName(path: string): string {
  return path.split("/").pop() || path;
}
