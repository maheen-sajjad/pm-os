import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TaskStatus, TaskCategory, TaskPriority } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");
    const status = searchParams.get("status") as TaskStatus | null;
    const assigneeId = searchParams.get("assigneeId");

    const tasks = await prisma.task.findMany({
      where: {
        ...(featureId && { featureId }),
        ...(status && { status }),
        ...(assigneeId && { assigneeId }),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, image: true },
        },
        linkedPR: true,
        feature: {
          select: { id: true, name: true, projectId: true },
        },
      },
      orderBy: [{ status: "asc" }, { order: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, featureId, category, priority, assigneeId } =
      body as {
        title: string;
        description?: string;
        featureId: string;
        category: TaskCategory;
        priority?: TaskPriority;
        assigneeId?: string;
      };

    if (!title || !featureId || !category) {
      return NextResponse.json(
        { error: "Title, featureId, and category are required" },
        { status: 400 }
      );
    }

    // Get feature's project and order info
    const [lastTask, featureData] = await Promise.all([
      prisma.task.findFirst({
        where: { featureId },
        orderBy: { order: "desc" },
        select: { order: true },
      }),
      prisma.feature.findUnique({
        where: { id: featureId },
        select: { projectId: true, project: { select: { leadId: true, nextTaskNumber: true } } },
      }),
    ]);

    if (!featureData) {
      return NextResponse.json(
        { error: "Feature not found" },
        { status: 404 }
      );
    }

    // Default to project lead if no assignee specified
    const finalAssigneeId = assigneeId ?? featureData.project?.leadId ?? null;

    // Create task and increment project's nextTaskNumber atomically
    const task = await prisma.$transaction(async (tx) => {
      // Get current project state
      const currentProject = await tx.project.findUnique({
        where: { id: featureData.projectId },
        select: { status: true, totalTasks: true },
      });

      // Get and increment the task number, auto-transition PLANNING → ACTIVE on first task
      const project = await tx.project.update({
        where: { id: featureData.projectId },
        data: {
          nextTaskNumber: { increment: 1 },
          totalTasks: { increment: 1 },
          ...(currentProject?.status === "PLANNING" && { status: "ACTIVE" }),
        },
        select: { nextTaskNumber: true },
      });

      // Create the task with the assigned number (use previous value)
      return tx.task.create({
        data: {
          taskNumber: project.nextTaskNumber - 1,
          title,
          description,
          featureId,
          category,
          priority: priority || "MEDIUM",
          assigneeId: finalAssigneeId,
          creatorId: session.user.id,
          order: (lastTask?.order ?? -1) + 1,
        },
        include: {
          assignee: {
            select: { id: true, name: true, email: true, image: true },
          },
          linkedPR: true,
        },
      });
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
