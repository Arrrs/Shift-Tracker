"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  Briefcase,
  BarChart3,
  Shield,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Zap,
  Globe,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold hidden sm:inline">Shift Tracker</span>
              <span className="text-xl font-bold sm:hidden">Tracker</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Track shifts, manage finances, grow your income
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Stop guessing your earnings.
              <span className="text-primary block mt-2">Start tracking them.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              The all-in-one shift tracker for hourly workers, freelancers, and anyone who wants
              to take control of their time and money. Know exactly what you&apos;ll earn before
              payday arrives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                  See How It Works
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Sound familiar?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              If you&apos;re dealing with any of these problems, Shift Tracker is built for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "😰",
                title: "Paycheck surprises",
                description: "You never know exactly how much you'll earn until payday. Sometimes it's less than expected, and budgeting becomes impossible.",
              },
              {
                icon: "📝",
                title: "Scattered records",
                description: "Your shifts are tracked in notes, texts, photos of schedules, or just memory. Finding old records is a nightmare.",
              },
              {
                icon: "🤯",
                title: "Multiple jobs chaos",
                description: "Working different jobs with different rates? Good luck keeping track of hours, overtime, and what each job owes you.",
              },
              {
                icon: "💸",
                title: "Hidden overtime",
                description: "Did that extra shift count as overtime? Are you getting paid correctly for holidays? You're not sure, and checking is tedious.",
              },
              {
                icon: "📊",
                title: "No financial visibility",
                description: "You want to see income trends, compare months, or plan for expenses—but all your data is scattered or nonexistent.",
              },
              {
                icon: "⏰",
                title: "Time anxiety",
                description: "Constantly checking: 'When does my shift start? How much longer?' You need a countdown, not endless calendar scrolling.",
              },
            ].map((problem, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
              >
                <span className="text-4xl mb-4 block">{problem.icon}</span>
                <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                <p className="text-muted-foreground">{problem.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              One app to solve them all
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Shift Tracker brings clarity to your work life. Track time, see earnings instantly,
              and finally feel in control.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {[
                {
                  icon: <TrendingUp className="h-6 w-6" />,
                  title: "See your earnings in real-time",
                  description: "Every shift you add instantly calculates your earnings. Watch your monthly income grow as you work.",
                },
                {
                  icon: <Briefcase className="h-6 w-6" />,
                  title: "Manage multiple jobs effortlessly",
                  description: "Different pay rates, currencies, and schedules—all organized in one place with color-coded clarity.",
                },
                {
                  icon: <Calendar className="h-6 w-6" />,
                  title: "Visual calendar with smart insights",
                  description: "See your month at a glance. Planned shifts, completed work, income vs expenses—all visible instantly.",
                },
                {
                  icon: <Clock className="h-6 w-6" />,
                  title: "Live countdown to shifts",
                  description: "Know exactly when your next shift starts. No more calendar app hunting or schedule photo searching.",
                },
              ].map((solution, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {solution.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{solution.title}</h3>
                    <p className="text-muted-foreground">{solution.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 border">
                <div className="h-full rounded-xl bg-card border shadow-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">January 2026</span>
                    <span className="text-2xl font-bold text-primary">$3,240</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-primary rounded-full" />
                  </div>
                  <p className="text-sm text-muted-foreground">75% of monthly goal</p>
                  <div className="space-y-2 pt-4">
                    {[
                      { job: "Restaurant", hours: "32h", amount: "$480", color: "#10B981" },
                      { job: "Delivery", hours: "18h", amount: "$360", color: "#3B82F6" },
                      { job: "Freelance", hours: "12h", amount: "$600", color: "#8B5CF6" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-medium">{item.job}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">{item.hours}</span>
                          <span className="ml-3 font-semibold">{item.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to track your work
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for real workers with real needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Smart Dashboard",
                description: "Monthly overview with earnings breakdown, hours worked, and completion rates at a glance.",
              },
              {
                icon: <Briefcase className="h-6 w-6" />,
                title: "Multi-Job Support",
                description: "Track unlimited jobs with individual pay rates, currencies, and shift templates.",
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                title: "Visual Calendar",
                description: "Color-coded shifts, income indicators, and easy day-by-day navigation.",
              },
              {
                icon: <DollarSign className="h-6 w-6" />,
                title: "Financial Tracking",
                description: "Log income and expenses, categorize transactions, see net profit.",
              },
              {
                icon: <Clock className="h-6 w-6" />,
                title: "Shift Countdown",
                description: "Live timer showing exactly when your next shift starts or ends.",
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Multi-Currency",
                description: "Work in different currencies? Track each separately with proper symbols.",
              },
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: "Mobile-First Design",
                description: "Works beautifully on any device. Add shifts from anywhere, anytime.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Private & Secure",
                description: "Your data stays yours. Encrypted, backed up, and never shared.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-card hover:border-primary/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built for people who work
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you work one job or five, Shift Tracker adapts to your life.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: "👨‍🍳",
                title: "Hourly Workers",
                examples: ["Restaurant staff", "Retail employees", "Warehouse workers", "Security guards"],
                highlight: "Track every hour, never miss overtime pay",
              },
              {
                emoji: "🚗",
                title: "Gig Workers",
                examples: ["Delivery drivers", "Rideshare", "Task workers", "On-demand services"],
                highlight: "Multiple apps, one place to see total earnings",
              },
              {
                emoji: "💻",
                title: "Freelancers",
                examples: ["Designers", "Writers", "Developers", "Consultants"],
                highlight: "Different clients, different rates, all tracked",
              },
            ].map((useCase, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl border bg-card hover:shadow-xl transition-shadow"
              >
                <span className="text-5xl mb-6 block">{useCase.emoji}</span>
                <h3 className="text-xl font-bold mb-4">{useCase.title}</h3>
                <ul className="space-y-2 mb-6">
                  {useCase.examples.map((example, i) => (
                    <li key={i} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      {example}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-medium text-primary">{useCase.highlight}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "∞", label: "Unlimited shifts" },
              { value: "∞", label: "Unlimited jobs" },
              { value: "24/7", label: "Access anywhere" },
              { value: "0", label: "Ads or tracking" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-4xl sm:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Loved by workers everywhere
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands who finally have clarity about their earnings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finally, I know exactly what my paycheck will be before it arrives. No more surprises, no more stress.",
                author: "Maria K.",
                role: "Restaurant Server",
              },
              {
                quote: "I work three different jobs. Before Countdown, I had no idea what I was actually earning. Now it's all in one place.",
                author: "James T.",
                role: "Gig Worker",
              },
              {
                quote: "The countdown feature is perfect. I always know exactly when my shift starts without checking multiple apps.",
                author: "Sarah L.",
                role: "Retail Associate",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border bg-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-500">★</span>
                  ))}
                </div>
                <p className="text-muted-foreground mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to take control of your time and money?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join Shift Tracker today. It takes 30 seconds to sign up,
            and you&apos;ll wonder how you ever managed without it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Setup in seconds
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-bold">Shift Tracker</span>
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="mailto:support@shifttracker.app" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Shift Tracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
