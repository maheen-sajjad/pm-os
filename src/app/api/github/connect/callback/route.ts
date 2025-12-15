import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=unauthorized`
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("GitHub OAuth error:", error);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=github_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=invalid_callback`
      );
    }

    // Verify state token
    let stateData: { userId: string; nonce: string };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=invalid_state`
      );
    }

    // Verify the state userId matches the current session
    if (stateData.userId !== session.user.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=state_mismatch`
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("GitHub token exchange error:", tokenData);
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=token_exchange_failed`
      );
    }

    // Get GitHub user info
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const githubUser = await userResponse.json();

    if (!githubUser.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=github_user_fetch_failed`
      );
    }

    // Check if this GitHub account is already linked to another user
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: "github",
        providerAccountId: String(githubUser.id),
      },
    });

    if (existingAccount && existingAccount.userId !== session.user.id) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/projects?error=github_already_linked`
      );
    }

    // Upsert the GitHub account for this user
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "github",
          providerAccountId: String(githubUser.id),
        },
      },
      update: {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || "bearer",
        scope: tokenData.scope,
      },
      create: {
        userId: session.user.id,
        type: "oauth",
        provider: "github",
        providerAccountId: String(githubUser.id),
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || "bearer",
        scope: tokenData.scope,
      },
    });

    // Redirect back to projects with success message
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/projects?github_connected=true`
    );
  } catch (error) {
    console.error("Error in GitHub connect callback:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/projects?error=connection_failed`
    );
  }
}
