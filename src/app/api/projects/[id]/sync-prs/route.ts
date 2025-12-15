import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getRepoPullRequests, parseTaskIdFromBranch } from "@/lib/github";

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

    // Get project with repo
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        repo: true,
        features: {
          include: {
            tasks: true,
          },
        },
      },
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

    // Get user's GitHub access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
      select: {
        access_token: true,
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    // Parse owner and repo from fullName (e.g., "owner/repo")
    const [owner, repoName] = project.repo.fullName.split("/");

    // Fetch PRs from GitHub
    const prs = await getRepoPullRequests(
      account.access_token,
      owner,
      repoName,
      "all"
    );

    // Get all task IDs in this project
    const taskMap = new Map<string, string>();
    project.features.forEach((feature) => {
      feature.tasks.forEach((task) => {
        // Map task ID to itself (for direct matches)
        taskMap.set(task.id, task.id);
        // Also try to match by a shorter format if the ID contains certain patterns
        const shortId = task.id.split("-").pop();
        if (shortId) {
          taskMap.set(shortId, task.id);
        }
      });
    });

    // Process each PR
    const results = {
      synced: 0,
      linked: 0,
      errors: [] as string[],
    };

    for (const pr of prs) {
      try {
        // Determine PR status
        const prStatus = pr.merged ? "MERGED" : pr.state === "open" ? "OPEN" : "CLOSED";

        // Upsert PR record
        const existingPR = await prisma.pullRequest.findUnique({
          where: {
            repoId_number: {
              repoId: project.repo!.id,
              number: pr.number,
            },
          },
        });

        let pullRequest;
        if (existingPR) {
          pullRequest = await prisma.pullRequest.update({
            where: { id: existingPR.id },
            data: {
              title: pr.title,
              url: pr.url,
              status: prStatus,
              author: pr.author,
              branchName: pr.branchName,
              commitsCount: pr.commitsCount,
            },
          });
        } else {
          pullRequest = await prisma.pullRequest.create({
            data: {
              number: pr.number,
              title: pr.title,
              url: pr.url,
              status: prStatus,
              author: pr.author,
              branchName: pr.branchName,
              commitsCount: pr.commitsCount,
              repoId: project.repo!.id,
            },
          });
        }

        results.synced++;

        // Try to link PR to task based on branch name
        const taskIdFromBranch = parseTaskIdFromBranch(pr.branchName);
        if (taskIdFromBranch) {
          const actualTaskId = taskMap.get(taskIdFromBranch);
          if (actualTaskId) {
            // Check if task doesn't already have a linked PR
            const task = await prisma.task.findUnique({
              where: { id: actualTaskId },
              select: { linkedPRId: true },
            });

            if (task && !task.linkedPRId) {
              await prisma.task.update({
                where: { id: actualTaskId },
                data: { linkedPRId: pullRequest.id },
              });
              results.linked++;
            }
          }
        }
      } catch (prError) {
        results.errors.push(`PR #${pr.number}: ${(prError as Error).message}`);
      }
    }

    return NextResponse.json({
      message: `Synced ${results.synced} PRs, linked ${results.linked} to tasks`,
      ...results,
    });
  } catch (error) {
    console.error("Error syncing PRs:", error);
    return NextResponse.json(
      { error: "Failed to sync pull requests" },
      { status: 500 }
    );
  }
}
