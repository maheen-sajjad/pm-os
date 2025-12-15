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
    const role = searchParams.get("role");
    const teamType = searchParams.get("teamType") as TeamType | null;
    const canApprove = searchParams.get("canApprove");

    const users = await prisma.user.findMany({
      where: {
        ...(role && { role: role as "SUPER_ADMIN" | "ADMIN" | "LEAD" | "MEMBER" }),
        ...(teamType && {
          teams: {
            some: {
              team: { type: teamType },
            },
          },
        }),
        ...(canApprove === "true" && { canApproveCreatives: true }),
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
