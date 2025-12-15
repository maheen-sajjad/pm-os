import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractTasksFromDocument } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { featureName, documentContent, model } = body as {
      featureName: string;
      documentContent: string;
      model?: string;
    };

    if (!featureName || !documentContent) {
      return NextResponse.json(
        { error: "Feature name and document content are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const result = await extractTasksFromDocument(
      featureName,
      documentContent,
      model
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error extracting tasks:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract tasks" },
      { status: 500 }
    );
  }
}
