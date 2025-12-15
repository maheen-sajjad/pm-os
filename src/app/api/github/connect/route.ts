import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();

    // If not authenticated, redirect to login
    if (!session?.user?.id) {
      const loginUrl = new URL("/login", process.env.NEXTAUTH_URL);
      loginUrl.searchParams.set("callbackUrl", "/projects");
      return NextResponse.redirect(loginUrl);
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        new URL("/projects?error=github_not_configured", process.env.NEXTAUTH_URL!)
      );
    }

    // Create a state token that includes the user ID (encrypted for security)
    const state = Buffer.from(
      JSON.stringify({
        userId: session.user.id,
        nonce: crypto.randomBytes(16).toString("hex"),
      })
    ).toString("base64url");

    const redirectUri = `${process.env.NEXTAUTH_URL}/api/github/connect/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email repo",
      state,
    });

    const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return NextResponse.redirect(githubAuthUrl);
  } catch (error) {
    console.error("Error initiating GitHub connect:", error);
    return NextResponse.redirect(
      new URL("/projects?error=connection_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
