import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserRepos } from "@/lib/github";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's GitHub access token from their account
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
        { error: "GitHub account not connected. Please login with GitHub first." },
        { status: 400 }
      );
    }

    const repos = await getUserRepos(account.access_token);

    return NextResponse.json(repos);
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return NextResponse.json(
      { error: "Failed to fetch GitHub repositories" },
      { status: 500 }
    );
  }
}
