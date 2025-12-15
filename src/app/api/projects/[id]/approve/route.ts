import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Project must be in PENDING_APPROVAL status
    if (project.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "Project must be in PENDING_APPROVAL status to approve/reject" },
        { status: 400 }
      );
    }

    // Check if user can approve
    const userId = session.user.id;
    const userRole = (session.user as any).role;

    // Get user to check canApproveCreatives
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { canApproveCreatives: true },
    });

    const canApprove =
      userRole === "SUPER_ADMIN" || user?.canApproveCreatives === true;

    if (!canApprove) {
      return NextResponse.json(
        { error: "You do not have permission to approve projects" },
        { status: 403 }
      );
    }

    // Update project based on action
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: action === "approve" ? "COMPLETED" : "ACTIVE",
        ...(action === "approve" && {
          approvedById: userId,
          approvedAt: new Date(),
        }),
        // If rejected, clear any previous approval info
        ...(action === "reject" && {
          approvedById: null,
          approvedAt: null,
        }),
      },
      include: {
        lead: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json({
      ...updatedProject,
      message: action === "approve"
        ? "Project approved successfully"
        : "Project sent back for revisions",
    });
  } catch (error) {
    console.error("Error approving/rejecting project:", error);
    return NextResponse.json(
      { error: "Failed to process approval" },
      { status: 500 }
    );
  }
}
