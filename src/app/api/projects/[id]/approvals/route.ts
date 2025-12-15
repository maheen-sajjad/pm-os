import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ApprovalType, TeamType } from "@prisma/client";

// Map ApprovalType to required TeamType
const APPROVAL_TEAM_MAP: Record<ApprovalType, TeamType> = {
  DEV: TeamType.DEVELOPMENT,
  QA: TeamType.QA,
  UI: TeamType.DESIGN,
  UAT: TeamType.UAT,
};

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

    const approvals = await prisma.projectApproval.findMany({
      where: { projectId: id },
      include: {
        approvedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { type: "asc" },
    });

    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Error fetching project approvals:", error);
    return NextResponse.json(
      { error: "Failed to fetch project approvals" },
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

    const { id } = await params;
    const body = await request.json();
    const { type, approved } = body as { type: ApprovalType; approved: boolean };

    if (!type || !Object.values(ApprovalType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid approval type" },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is a member of the required team (unless SUPER_ADMIN)
    const requiredTeamType = APPROVAL_TEAM_MAP[type];

    if (session.user.role !== "SUPER_ADMIN") {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          userId: session.user.id,
          team: {
            type: requiredTeamType,
          },
        },
      });

      if (!userTeam) {
        return NextResponse.json(
          { error: `You must be a member of the ${requiredTeamType} team to ${approved ? "approve" : "revoke"} ${type} approval` },
          { status: 403 }
        );
      }
    }

    // Upsert the approval
    const approval = await prisma.projectApproval.upsert({
      where: {
        projectId_type: {
          projectId: id,
          type,
        },
      },
      update: {
        approved,
        approvedById: approved ? session.user.id : null,
        approvedAt: approved ? new Date() : null,
      },
      create: {
        projectId: id,
        type,
        approved,
        approvedById: approved ? session.user.id : null,
        approvedAt: approved ? new Date() : null,
      },
      include: {
        approvedBy: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(approval);
  } catch (error) {
    console.error("Error updating project approval:", error);
    return NextResponse.json(
      { error: "Failed to update project approval" },
      { status: 500 }
    );
  }
}
