import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { KBEntryCategory } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const entries = await prisma.knowledgeBaseEntry.findMany({
      where: {
        projectId,
        ...(category && { category: category as KBEntryCategory }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { attachments: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();
    const { title, content, category } = body as {
      title: string;
      content: string;
      category?: KBEntryCategory;
    };

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const entry = await prisma.knowledgeBaseEntry.create({
      data: {
        title,
        content,
        category: category || "DOCUMENTATION",
        projectId,
        creatorId: session.user.id,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: {
          select: { attachments: true },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to create knowledge base entry" },
      { status: 500 }
    );
  }
}
