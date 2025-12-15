import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateUniquePrefix } from "@/lib/project-prefix";

interface RepoToImport {
  id: number;
  name: string;
  fullName: string;
  url: string;
  isPrivate: boolean;
}

interface ImportResult {
  created: Array<{
    projectId: string;
    projectName: string;
    repoFullName: string;
  }>;
  skipped: Array<{
    repoFullName: string;
    reason: string;
  }>;
  errors: Array<{
    repoFullName: string;
    error: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repos } = body as { repos: RepoToImport[] };

    if (!repos || !Array.isArray(repos) || repos.length === 0) {
      return NextResponse.json(
        { error: "No repositories provided" },
        { status: 400 }
      );
    }

    // Get existing linked repos to check for duplicates
    const existingRepos = await prisma.gitHubRepo.findMany({
      where: {
        fullName: {
          in: repos.map((r) => r.fullName),
        },
      },
      select: { fullName: true },
    });

    const existingFullNames = new Set(existingRepos.map((r) => r.fullName));

    const result: ImportResult = {
      created: [],
      skipped: [],
      errors: [],
    };

    // Process each repo
    for (const repo of repos) {
      // Skip if already linked to a project
      if (existingFullNames.has(repo.fullName)) {
        result.skipped.push({
          repoFullName: repo.fullName,
          reason: "Repository already linked to a project",
        });
        continue;
      }

      try {
        // Generate unique prefix before transaction
        const prefix = await generateUniquePrefix(repo.name);

        // Create project and link repo in a transaction
        const project = await prisma.$transaction(async (tx) => {
          // Create the project
          const newProject = await tx.project.create({
            data: {
              name: repo.name,
              prefix,
              description: `Imported from GitHub: ${repo.fullName}`,
              creatorId: session.user.id,
              status: "PLANNING",
            },
          });

          // Create and link the GitHub repo
          await tx.gitHubRepo.create({
            data: {
              name: repo.name,
              fullName: repo.fullName,
              url: repo.url,
              isPrivate: repo.isPrivate,
              projectId: newProject.id,
            },
          });

          return newProject;
        });

        result.created.push({
          projectId: project.id,
          projectName: project.name,
          repoFullName: repo.fullName,
        });
      } catch (error) {
        result.errors.push({
          repoFullName: repo.fullName,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error importing repos as projects:", error);
    return NextResponse.json(
      { error: "Failed to import repositories" },
      { status: 500 }
    );
  }
}
