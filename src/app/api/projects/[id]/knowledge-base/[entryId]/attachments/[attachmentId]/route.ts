import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteFile } from "@/lib/kb-storage";
import { hasPermission } from "@/lib/permissions";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string; attachmentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, entryId, attachmentId } = await params;

    // Verify entry exists and get creator for permission check
    const entry = await prisma.knowledgeBaseEntry.findFirst({
      where: {
        id: entryId,
        projectId,
      },
      select: { id: true, creatorId: true },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = entry.creatorId === session.user.id;
    const canDeleteAll = hasPermission(session.user.role, "kb:delete-all");

    if (!isOwner && !canDeleteAll) {
      return NextResponse.json(
        { error: "You don't have permission to delete this attachment" },
        { status: 403 }
      );
    }

    // Get attachment
    const attachment = await prisma.kBAttachment.findFirst({
      where: {
        id: attachmentId,
        entryId,
      },
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Delete file from disk
    try {
      await deleteFile(attachment.storagePath);
    } catch (fileError) {
      console.error("Error deleting file from disk:", fileError);
      // Continue to delete DB record even if file deletion fails
    }

    // Delete attachment record
    await prisma.kBAttachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
