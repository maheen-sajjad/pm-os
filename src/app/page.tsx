import Link from "next/link";
import { Button } from "@/atoms/Button";
import { Typography } from "@/atoms/Typography";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-secondary-50">
      <div className="text-center space-y-6">
        <Typography as="h1" variant="h1" className="text-primary-600">
          PM-OS
        </Typography>
        <Typography variant="body" className="text-secondary-500 max-w-md">
          A modern project management operating system built with Next.js,
          following atomic design and hyper modular architecture.
        </Typography>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button variant="primary" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="lg">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
