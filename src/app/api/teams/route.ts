import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TeamType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as TeamType | null;

    const teams = await prisma.team.findMany({
      where: type ? { type } : undefined,
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
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

    // Only SUPER_ADMIN can create teams
    const userRole = (session.user as any).role;
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can create teams" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Team name and type are required" },
        { status: 400 }
      );
    }

    // Validate team type
    if (!Object.values(TeamType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid team type" },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        name,
        type,
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

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
