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
import { useTranslation } from "@/lib/i18n/use-translation";

export default function HomePage() {
  const { t } = useTranslation();

  const problems = [
    {
      icon: "😰",
      title: t("landingPaycheckSurprises"),
      description: t("landingPaycheckSurprisesDesc"),
    },
    {
      icon: "📝",
      title: t("landingScatteredRecords"),
      description: t("landingScatteredRecordsDesc"),
    },
    {
      icon: "🤯",
      title: t("landingMultipleJobsChaos"),
      description: t("landingMultipleJobsChaosDesc"),
    },
    {
      icon: "💸",
      title: t("landingHiddenOvertime"),
      description: t("landingHiddenOvertimeDesc"),
    },
    {
      icon: "📊",
      title: t("landingNoFinancialVisibility"),
      description: t("landingNoFinancialVisibilityDesc"),
    },
    {
      icon: "⏰",
      title: t("landingTimeAnxiety"),
      description: t("landingTimeAnxietyDesc"),
    },
  ];

  const solutions = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: t("landingSeeEarningsRealtime"),
      description: t("landingSeeEarningsRealtimeDesc"),
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: t("landingManageMultipleJobs"),
      description: t("landingManageMultipleJobsDesc"),
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: t("landingVisualCalendarInsights"),
      description: t("landingVisualCalendarInsightsDesc"),
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: t("landingLiveCountdown"),
      description: t("landingLiveCountdownDesc"),
    },
  ];

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: t("landingSmartDashboard"),
      description: t("landingSmartDashboardDesc"),
    },
    {
      icon: <Briefcase className="h-6 w-6" />,
      title: t("landingMultiJobSupport"),
      description: t("landingMultiJobSupportDesc"),
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: t("landingVisualCalendar"),
      description: t("landingVisualCalendarDesc"),
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: t("landingFinancialTracking"),
      description: t("landingFinancialTrackingDesc"),
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: t("landingShiftCountdown"),
      description: t("landingShiftCountdownDesc"),
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: t("landingMultiCurrency"),
      description: t("landingMultiCurrencyDesc"),
    },
    {
      icon: <Smartphone className="h-6 w-6" />,
      title: t("landingMobileFirst"),
      description: t("landingMobileFirstDesc"),
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: t("landingPrivateSecure"),
      description: t("landingPrivateSecureDesc"),
    },
  ];

  const useCases = [
    {
      emoji: "👨‍🍳",
      title: t("landingHourlyWorkers"),
      examples: [
        t("landingRestaurantStaff"),
        t("landingRetailEmployees"),
        t("landingWarehouseWorkers"),
        t("landingSecurityGuards"),
      ],
      highlight: t("landingTrackEveryHour"),
    },
    {
      emoji: "🚗",
      title: t("landingGigWorkers"),
      examples: [
        t("landingDeliveryDrivers"),
        t("landingRideshare"),
        t("landingTaskWorkers"),
        t("landingOnDemandServices"),
      ],
      highlight: t("landingMultipleAppsOnePlace"),
    },
    {
      emoji: "💻",
      title: t("landingFreelancers"),
      examples: [
        t("landingDesigners"),
        t("landingWriters"),
        t("landingDevelopers"),
        t("landingConsultants"),
      ],
      highlight: t("landingDifferentClientsTracked"),
    },
  ];

  const stats = [
    { value: "∞", label: t("landingUnlimitedShifts") },
    { value: "∞", label: t("landingUnlimitedJobs") },
    { value: "24/7", label: t("landingAccessAnywhere") },
    { value: "0", label: t("landingNoAdsTracking") },
  ];

  const testimonials = [
    {
      quote: t("landingTestimonial1"),
      author: t("landingTestimonial1Author"),
      role: t("landingTestimonial1Role"),
    },
    {
      quote: t("landingTestimonial2"),
      author: t("landingTestimonial2Author"),
      role: t("landingTestimonial2Role"),
    },
    {
      quote: t("landingTestimonial3"),
      author: t("landingTestimonial3Author"),
      role: t("landingTestimonial3Role"),
    },
  ];

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
                  {t("signIn")}
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm">
                  {t("landingGetStarted")}
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
              {t("landingTagline")}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {t("landingHeroTitle1")}
              <span className="text-primary block mt-2">{t("landingHeroTitle2")}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              {t("landingHeroDescription")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/sign-up">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                  {t("landingStart")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                  {t("landingSeeHowItWorks")}
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              {t("landingNoCreditCard")}
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              {t("landingSoundFamiliar")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landingIfDealingProblems")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem, index) => (
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
              {t("landingOneAppSolve")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landingSolutionDesc")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {solutions.map((solution, index) => (
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
                  <p className="text-sm text-muted-foreground">75% {t("landingOfMonthlyGoal")}</p>
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
              {t("landingEverythingYouNeed")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landingPowerfulFeatures")}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
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
              {t("landingBuiltForPeople")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landingAdaptsToLife")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
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
            {stats.map((stat, index) => (
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
              {t("landingLovedByWorkers")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landingJoinThousands")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
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
            {t("landingReadyToTakeControl")}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t("landingJoinToday")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                {t("landingCreateFreeAccount")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {t("landingNoCreditCard")}
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {t("landingSetupInSeconds")}
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {t("landingCancelAnytime")}
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
                {t("landingFeatures")}
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {t("landingPrivacy")}
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                {t("landingTerms")}
              </Link>
              <Link href="mailto:support@shifttracker.app" className="hover:text-foreground transition-colors">
                {t("landingContact")}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Shift Tracker. {t("landingAllRightsReserved")}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
