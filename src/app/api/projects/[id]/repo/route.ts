import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Link a GitHub repo to a project
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
    const { name, fullName, url, isPrivate } = body;

    if (!fullName || !url) {
      return NextResponse.json(
        { error: "Repository fullName and url are required" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { repo: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If project already has a repo, update it; otherwise create new
    let repo;
    if (project.repo) {
      repo = await prisma.gitHubRepo.update({
        where: { id: project.repo.id },
        data: { name, fullName, url, isPrivate },
      });
    } else {
      repo = await prisma.gitHubRepo.create({
        data: {
          name,
          fullName,
          url,
          isPrivate,
          projectId,
        },
      });
    }

    return NextResponse.json(repo);
  } catch (error) {
    console.error("Error linking repo:", error);
    return NextResponse.json(
      { error: "Failed to link repository" },
      { status: 500 }
    );
  }
}

// Unlink a GitHub repo from a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { repo: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.repo) {
      return NextResponse.json(
        { error: "No repository linked to this project" },
        { status: 400 }
      );
    }

    await prisma.gitHubRepo.delete({
      where: { id: project.repo.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unlinking repo:", error);
    return NextResponse.json(
      { error: "Failed to unlink repository" },
      { status: 500 }
    );
  }
}
