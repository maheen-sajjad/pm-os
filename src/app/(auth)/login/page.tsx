import Link from "next/link";
import { AuthLayout } from "@/templates/AuthLayout";
import { LoginForm } from "@/features/auth";
import { Typography } from "@/atoms/Typography";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
      <LoginForm />
      <div className="mt-6 text-center">
        <Typography variant="small" className="text-secondary-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary-600 hover:underline">
            Sign up
          </Link>
        </Typography>
      </div>
    </AuthLayout>
  );
}
