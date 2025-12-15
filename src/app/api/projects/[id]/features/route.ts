import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TaskCategory, TaskStatus } from "@prisma/client";

interface ExtractedTask {
  title: string;
  category: TaskCategory;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

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

    const features = await prisma.feature.findMany({
      where: { projectId },
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
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(features);
  } catch (error) {
    console.error("Error fetching features:", error);
    return NextResponse.json(
      { error: "Failed to fetch features" },
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
    const { name, description, docContent, tasks } = body as {
      name: string;
      description?: string;
      docContent?: string;
      tasks?: ExtractedTask[];
    };

    if (!name) {
      return NextResponse.json(
        { error: "Feature name is required" },
        { status: 400 }
      );
    }

    // Get project info for auto-assignment and task numbering
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { leadId: true, nextTaskNumber: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Create feature with tasks in a transaction to handle taskNumber atomically
    const feature = await prisma.$transaction(async (tx) => {
      const taskCount = tasks?.length || 0;

      // Update project's nextTaskNumber and totalTasks if creating tasks
      if (taskCount > 0) {
        await tx.project.update({
          where: { id: projectId },
          data: {
            nextTaskNumber: { increment: taskCount },
            totalTasks: { increment: taskCount },
          },
        });
      }

      // Create feature with tasks (each task gets a sequential number)
      return tx.feature.create({
        data: {
          name,
          description,
          docContent,
          projectId,
          tasks: tasks
            ? {
                create: tasks.map((task, index) => ({
                  taskNumber: project.nextTaskNumber + index,
                  title: task.title,
                  category: task.category,
                  priority: task.priority || "MEDIUM",
                  status: "BACKLOG" as TaskStatus,
                  order: index,
                  creatorId: session.user.id,
                  assigneeId: project.leadId || null,
                })),
              }
            : undefined,
        },
        include: {
          tasks: {
            include: {
              assignee: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(feature, { status: 201 });
  } catch (error) {
    console.error("Error creating feature:", error);
    return NextResponse.json(
      { error: "Failed to create feature" },
      { status: 500 }
    );
  }
}
