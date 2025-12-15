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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        canApproveCreatives: true,
        teams: {
          include: {
            team: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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

    // Only SUPER_ADMIN can update user permissions
    const userRole = (session.user as any).role;
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only Super Admin can update user permissions" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { canApproveCreatives, role } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(typeof canApproveCreatives === "boolean" && { canApproveCreatives }),
        ...(role && { role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        canApproveCreatives: true,
        teams: {
          include: {
            team: {
              select: { id: true, name: true, type: true },
            },
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
