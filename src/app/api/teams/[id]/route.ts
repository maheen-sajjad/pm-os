import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TeamType } from "@prisma/client";

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

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true, role: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
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

    // Only SUPER_ADMIN can update teams
    const userRole = (session.user as any).role;
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can update teams" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, type } = body;

    // Validate team type if provided
    if (type && !Object.values(TeamType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid team type" },
        { status: 400 }
      );
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true, role: true },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error("Error updating team:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
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

    // Only SUPER_ADMIN can delete teams
    const userRole = (session.user as any).role;
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can delete teams" },
        { status: 403 }
      );
    }

    const { id } = await params;

    await prisma.team.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
