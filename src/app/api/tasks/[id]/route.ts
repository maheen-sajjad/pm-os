import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        creator: {
          select: { id: true, name: true, email: true, image: true },
        },
        linkedPR: true,
        feature: {
          select: {
            id: true,
            name: true,
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
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
    const { title, description, status, category, priority, assigneeId, order } =
      body;

    // Get current task to check if status is changing to DONE
    const currentTask = await prisma.task.findUnique({
      where: { id },
      select: { status: true, featureId: true },
    });

    if (!currentTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(order !== undefined && { order }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        linkedPR: true,
      },
    });

    // Update project completed tasks count if status changed
    if (status && currentTask.status !== status) {
      const feature = await prisma.feature.findUnique({
        where: { id: currentTask.featureId },
        select: { projectId: true },
      });

      if (feature) {
        if (status === "DONE" && currentTask.status !== "DONE") {
          // Increment completed count and check if all tasks are now done
          const project = await prisma.project.update({
            where: { id: feature.projectId },
            data: { completedTasks: { increment: 1 } },
            select: { status: true, totalTasks: true, completedTasks: true },
          });

          // Auto-transition ACTIVE → PENDING_APPROVAL when all tasks complete
          if (
            project.status === "ACTIVE" &&
            project.completedTasks === project.totalTasks &&
            project.totalTasks > 0
          ) {
            await prisma.project.update({
              where: { id: feature.projectId },
              data: { status: "PENDING_APPROVAL" },
            });
          }
        } else if (status !== "DONE" && currentTask.status === "DONE") {
          await prisma.project.update({
            where: { id: feature.projectId },
            data: { completedTasks: { decrement: 1 } },
          });
        }
      }
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
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

    // Get task info before deleting
    const task = await prisma.task.findUnique({
      where: { id },
      select: { status: true, featureId: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    // Update project task counts
    const feature = await prisma.feature.findUnique({
      where: { id: task.featureId },
      select: { projectId: true },
    });

    if (feature) {
      await prisma.project.update({
        where: { id: feature.projectId },
        data: {
          totalTasks: { decrement: 1 },
          ...(task.status === "DONE" && { completedTasks: { decrement: 1 } }),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
