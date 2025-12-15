import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseTaskIdFromBranch, verifyWebhookSignature } from "@/lib/github";

interface PullRequestPayload {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    state: "open" | "closed";
    merged: boolean;
    merged_at: string | null;
    user: { login: string };
    head: { ref: string };
    commits: number;
  };
  repository: {
    full_name: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    // Only process pull_request events
    if (event !== "pull_request") {
      return NextResponse.json({ message: "Event ignored" });
    }

    const payload = await request.text();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(payload, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const data = JSON.parse(payload) as PullRequestPayload;
    const { action, pull_request: pr, repository } = data;

    // Find the repo in our database (using findFirst since fullName is not unique)
    const repo = await prisma.gitHubRepo.findFirst({
      where: { fullName: repository.full_name },
      include: {
        project: {
          include: {
            features: {
              include: { tasks: true },
            },
          },
        },
      },
    });

    if (!repo) {
      return NextResponse.json({ message: "Repository not tracked" });
    }

    // Determine PR status
    const prStatus = pr.merged ? "MERGED" : pr.state === "open" ? "OPEN" : "CLOSED";

    // Upsert PR record
    const existingPR = await prisma.pullRequest.findUnique({
      where: {
        repoId_number: {
          repoId: repo.id,
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
          url: pr.html_url,
          status: prStatus,
          author: pr.user.login,
          branchName: pr.head.ref,
          commitsCount: pr.commits,
        },
      });
    } else {
      pullRequest = await prisma.pullRequest.create({
        data: {
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          status: prStatus,
          author: pr.user.login,
          branchName: pr.head.ref,
          commitsCount: pr.commits,
          repoId: repo.id,
        },
      });
    }

    // Try to auto-link PR to task on opened/reopened
    if (action === "opened" || action === "reopened") {
      const taskIdFromBranch = parseTaskIdFromBranch(pr.head.ref);

      if (taskIdFromBranch) {
        // Build task map from project
        const taskMap = new Map<string, string>();
        repo.project.features.forEach((feature) => {
          feature.tasks.forEach((task) => {
            taskMap.set(task.id, task.id);
            const shortId = task.id.split("-").pop();
            if (shortId) {
              taskMap.set(shortId, task.id);
            }
          });
        });

        const actualTaskId = taskMap.get(taskIdFromBranch);
        if (actualTaskId) {
          const task = await prisma.task.findUnique({
            where: { id: actualTaskId },
            select: { linkedPRId: true },
          });

          if (task && !task.linkedPRId) {
            await prisma.task.update({
              where: { id: actualTaskId },
              data: { linkedPRId: pullRequest.id },
            });
          }
        }
      }
    }

    // Auto-update task status when PR is merged
    if (action === "closed" && pr.merged) {
      // Find task linked to this PR
      const linkedTask = await prisma.task.findFirst({
        where: { linkedPRId: pullRequest.id },
      });

      if (linkedTask && linkedTask.status !== "DONE") {
        // Move task to REVIEW or DONE based on preference
        await prisma.task.update({
          where: { id: linkedTask.id },
          data: { status: "REVIEW" },
        });
      }
    }

    return NextResponse.json({
      message: "Webhook processed",
      action,
      prNumber: pr.number,
      status: prStatus,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
