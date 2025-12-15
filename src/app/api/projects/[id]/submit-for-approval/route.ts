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

    // Get the project
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        lead: true,
        creator: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only lead, creator, or SUPER_ADMIN can submit for approval
    const userId = session.user.id;
    const userRole = (session.user as any).role;
    const canSubmit =
      userId === project.leadId ||
      userId === project.creatorId ||
      userRole === "SUPER_ADMIN";

    if (!canSubmit) {
      return NextResponse.json(
        { error: "Only project lead, creator, or Super Admin can submit for approval" },
        { status: 403 }
      );
    }

    // Project must be in ACTIVE status to be submitted for approval
    if (project.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Project must be in ACTIVE status to submit for approval" },
        { status: 400 }
      );
    }

    // Update project status to PENDING_APPROVAL
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        status: "PENDING_APPROVAL",
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

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error submitting project for approval:", error);
    return NextResponse.json(
      { error: "Failed to submit project for approval" },
      { status: 500 }
    );
  }
}
