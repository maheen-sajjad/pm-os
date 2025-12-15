import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { KBEntryCategory } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, entryId } = await params;

    const entry = await prisma.knowledgeBaseEntry.findFirst({
      where: {
        id: entryId,
        projectId,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch knowledge base entry" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, entryId } = await params;
    const body = await request.json();
    const { title, content, category } = body as {
      title?: string;
      content?: string;
      category?: KBEntryCategory;
    };

    // Check entry exists and get creator
    const existingEntry = await prisma.knowledgeBaseEntry.findFirst({
      where: {
        id: entryId,
        projectId,
      },
      select: { creatorId: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check permissions: can edit own entries, or admin/super_admin can edit all
    const isOwner = existingEntry.creatorId === session.user.id;
    const canEditAll = hasPermission(session.user.role, "kb:edit-all");

    if (!isOwner && !canEditAll) {
      return NextResponse.json(
        { error: "You don't have permission to edit this entry" },
        { status: 403 }
      );
    }

    const entry = await prisma.knowledgeBaseEntry.update({
      where: { id: entryId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to update knowledge base entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, entryId } = await params;

    // Check entry exists and get creator
    const existingEntry = await prisma.knowledgeBaseEntry.findFirst({
      where: {
        id: entryId,
        projectId,
      },
      select: { creatorId: true },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check permissions: can delete own entries, or admin/super_admin can delete all
    const isOwner = existingEntry.creatorId === session.user.id;
    const canDeleteAll = hasPermission(session.user.role, "kb:delete-all");

    if (!isOwner && !canDeleteAll) {
      return NextResponse.json(
        { error: "You don't have permission to delete this entry" },
        { status: 403 }
      );
    }

    // Delete entry (attachments cascade delete via Prisma)
    await prisma.knowledgeBaseEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting knowledge base entry:", error);
    return NextResponse.json(
      { error: "Failed to delete knowledge base entry" },
      { status: 500 }
    );
  }
}
