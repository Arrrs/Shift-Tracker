"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/lib/i18n/language-context";
import { useTranslation } from "@/lib/i18n/use-translation";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-full p-4 sm:p-8 flex flex-col">
      <h1 className="text-3xl font-bold mb-4">Changes</h1>
      <p className="text-muted-foreground mb-8">
        Last changes and updates made to the application.
      </p>

      <div className="max-w-2xl space-y-6 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Version 1.0.1 - Performance & Fixes</CardTitle>
            <CardDescription>
              Bug fixes and performance improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ul className="list-disc list-inside">
                <li>Optimized application performance and load times.</li>
                <li>Fixed critical bugs affecting user experience.</li>
                <li>Improved database query efficiency.</li>
                <li>Enhanced UI responsiveness across devices.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Version 1.0.0 - Initial Release</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ul className="list-disc list-inside">
                <li>Initial release of the application.</li>
                <li>Implemented core features and functionalities.</li>
                <li>Set up user authentication and profile data management.</li>
                <li>Designed and developed the user interface.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
