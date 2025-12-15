import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
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
        repo: true,
        features: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, email: true, image: true },
                },
                linkedPR: true,
              },
              orderBy: { order: "asc" },
            },
          },
        },
        approvals: {
          include: {
            approvedBy: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const { name, description, status, leadId } = body;

    // Check permission if trying to assign a lead
    if (leadId !== undefined && !hasPermission(session.user.role, "projects:assign-lead")) {
      return NextResponse.json(
        { error: "You don't have permission to assign project leads" },
        { status: 403 }
      );
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(leadId !== undefined && { leadId }),
      },
      include: {
        lead: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        features: {
          include: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
