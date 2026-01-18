"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, Briefcase, Calendar, Settings, Menu, Hourglass, Tags, LogOut, HelpCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/use-translation";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{t("navigation")}</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col space-y-4 mt-6 flex-1">
          <Link href="/dashboard" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              {t("dashboard")}
            </Button>
          </Link>
          <Link href="/calendar" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {t("calendar")}
            </Button>
          </Link>
          <Link href="/jobs" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Briefcase className="mr-2 h-4 w-4" />
              {t("jobs")}
            </Button>
          </Link>
          <Link href="/categories" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Tags className="mr-2 h-4 w-4" />
              {t("categories")}
            </Button>
          </Link>
          <Link href="/countdown" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Hourglass className="mr-2 h-4 w-4" />
              {t("countdown")}
            </Button>
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              {t("settings")}
            </Button>
          </Link>
          <Link href="/help" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              <HelpCircle className="mr-2 h-4 w-4" />
              {t("help")}
            </Button>
          </Link>
        </nav>

        <div className="border-t pt-4 pb-6">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? t("loggingOut") : t("logOut")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
