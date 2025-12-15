import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has a GitHub account linked
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "github",
      },
      select: {
        providerAccountId: true,
        access_token: true,
      },
    });

    return NextResponse.json({
      connected: !!account?.access_token,
      hasAccount: !!account,
    });
  } catch (error) {
    console.error("Error checking GitHub status:", error);
    return NextResponse.json(
      { error: "Failed to check GitHub status" },
      { status: 500 }
    );
  }
}
