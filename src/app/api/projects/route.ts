import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";
import { hasPermission } from "@/lib/permissions";
import { generateUniquePrefix } from "@/lib/project-prefix";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ProjectStatus | null;

    const projects = await prisma.project.findMany({
      where: status ? { status } : undefined,
      include: {
        lead: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        repo: {
          select: { id: true, name: true, fullName: true, url: true },
        },
        features: {
          select: { id: true, name: true, progress: true },
        },
        approvals: {
          select: { type: true, approved: true, approvedAt: true, approvedBy: { select: { id: true, name: true, image: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
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
    const { name, description, leadId } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Check permission if assigning someone else as lead
    if (leadId && leadId !== session.user.id && !hasPermission(session.user.role, "projects:assign-lead")) {
      return NextResponse.json(
        { error: "You don't have permission to assign project leads" },
        { status: 403 }
      );
    }

    // Generate unique prefix from project name
    const prefix = await generateUniquePrefix(name);

    const project = await prisma.project.create({
      data: {
        name,
        prefix,
        description,
        leadId,
        creatorId: session.user.id,
        status: "PLANNING",
      },
      include: {
        lead: {
          select: { id: true, name: true, email: true, image: true, role: true },
        },
        features: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
