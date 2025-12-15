import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

// Disable worker for server-side usage
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    const fileType = file.type || "application/octet-stream";
    const fileName = file.name.toLowerCase();
    const extension = fileName.split(".").pop() || "";

    let text = "";

    // Determine file type and parse accordingly
    if (fileType === "application/pdf" || extension === "pdf") {
      text = await parsePdf(file);
    } else if (
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      extension === "docx"
    ) {
      text = await parseDocx(file);
    } else if (
      fileType === "text/plain" ||
      fileType === "text/markdown" ||
      ["txt", "md", "markdown"].includes(extension)
    ) {
      text = await parseText(file);
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType || extension}. Supported: PDF, DOCX, TXT, MD` },
        { status: 400 }
      );
    }

    // Clean up the extracted text
    text = cleanText(text);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file. The file may be empty or contain only images." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text,
      fileName: file.name,
      fileType: extension,
      characterCount: text.length,
    });
  } catch (error) {
    console.error("Document parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse document. Please try a different file or paste the content manually." },
      { status: 500 }
    );
  }
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item): item is TextItem => "str" in item)
      .map((item) => item.str)
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n\n");
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function parseText(file: File): Promise<string> {
  return await file.text();
}

function cleanText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove excessive blank lines (more than 2)
    .replace(/\n{3,}/g, "\n\n")
    // Remove leading/trailing whitespace from each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    // Trim the whole text
    .trim();
}