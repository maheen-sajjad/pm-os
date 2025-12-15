import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      canApproveCreatives: boolean;
    };
  }

  interface User {
    role: UserRole;
    canApproveCreatives: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    canApproveCreatives: boolean;
  }
}
