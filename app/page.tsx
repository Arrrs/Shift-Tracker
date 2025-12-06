import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen p-8">
      {/* Hero section */}
      <section className="flex flex-col items-center justify-center min-h-[40vh]">
        <h1 className="text-4xl font-bold mb-8">Shift Tracker</h1>
        <div className="flex gap-4">
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </section>

      {/* Features section */}
      <section className="py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* 4 cards here */}

          <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Dashboard</h3>
            <p className="text-muted-foreground">
              Real-time countdown to your next shift
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Job Management</h3>
            <p className="text-muted-foreground">
              Track multiple jobs with custom rates
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Calendar View</h3>
            <p className="text-muted-foreground">
              Visual shift schedule with color coding
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-card text-card-foreground">
            <h3 className="text-xl font-semibold mb-2">Salary Tracking</h3>
            <p className="text-muted-foreground">
              Automatic calculations with overtime
            </p>
          </div>

        </div>
      </section>
    </div>
  );
}
