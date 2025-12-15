import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { indexCodebase, getIndexStatus, clearCodeIndex } from "@/lib/indexCodebase";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project with repo
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        repo: {
          include: {
            indexStatus: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.repo) {
      return NextResponse.json(
        { error: "Project has no linked GitHub repository" },
        { status: 400 }
      );
    }

    // Check if already indexing
    if (project.repo.indexStatus?.indexingInProgress) {
      return NextResponse.json(
        { error: "Indexing already in progress" },
        { status: 409 }
      );
    }

    // Get GitHub access token for the user
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected. Please connect your GitHub account first." },
        { status: 400 }
      );
    }

    // Parse owner and repo from fullName (e.g., "owner/repo")
    const [owner, repoName] = project.repo.fullName.split("/");

    // Start indexing (async, but we return immediately with status)
    // Run the indexing in background
    const indexPromise = indexCodebase(
      project.repo.id,
      account.access_token,
      owner,
      repoName
    );

    // Don't await - let it run in background
    indexPromise.catch((err) => {
      console.error("Background indexing error:", err);
    });

    return NextResponse.json({
      message: "Indexing started",
      repoId: project.repo.id,
    });
  } catch (error: any) {
    console.error("Index code error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start indexing" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project with repo
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        repo: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.repo) {
      return NextResponse.json({
        indexed: false,
        hasRepo: false,
        lastIndexedAt: null,
        totalFiles: 0,
        totalChunks: 0,
        inProgress: false,
        lastError: null,
      });
    }

    const status = await getIndexStatus(project.repo.id);

    return NextResponse.json({
      ...status,
      hasRepo: true,
    });
  } catch (error: any) {
    console.error("Get index status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get index status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Get project with repo
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        repo: {
          select: { id: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.repo) {
      return NextResponse.json(
        { error: "Project has no linked repository" },
        { status: 400 }
      );
    }

    await clearCodeIndex(project.repo.id);

    return NextResponse.json({ message: "Index cleared" });
  } catch (error: any) {
    console.error("Clear index error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear index" },
      { status: 500 }
    );
  }
}
