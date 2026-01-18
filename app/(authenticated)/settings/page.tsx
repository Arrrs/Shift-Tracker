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
import { ScrollText, History, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUserSettings, useUpdateUserSettings } from "@/lib/hooks/use-user-settings";
import { CURRENCIES } from "@/lib/config/currencies";
import { toast } from "sonner";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // User settings hook
  const { data: userSettings, isLoading: loadingSettings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await updateSettings.mutateAsync({ primary_currency: newCurrency });
      toast.success(t("currencyUpdated") || "Currency updated successfully");
    } catch (error) {
      console.error("Error updating currency:", error);
      toast.error(t("errorUpdatingSettings") || "Failed to update currency");
    }
  };

  return (
    <div className="min-h-full p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-4">{t("settings")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("customizeYourPreferences")}
      </p>

      <div className="max-w-2xl space-y-6 mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t("appearance")}</CardTitle>
            <CardDescription>{t("chooseYourPreferredTheme")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="theme">{t("theme")}</Label>
              {mounted && (
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger id="theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("light")}</SelectItem>
                    <SelectItem value="dark">{t("dark")}</SelectItem>
                    <SelectItem value="system">{t("system")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("language")}</CardTitle>
            <CardDescription>
              {t("selectYourPreferredLanguage")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t("language")}</Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as "en" | "uk")}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="uk">Українська</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {t("currency")}
            </CardTitle>
            <CardDescription>
              {t("selectPrimaryCurrency")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-currency">{t("primaryCurrency")}</Label>
                <Select
                  value={userSettings?.primary_currency || "USD"}
                  onValueChange={handleCurrencyChange}
                  disabled={loadingSettings}
                >
                  <SelectTrigger id="primary-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(CURRENCIES).map(([code, currency]) => (
                      <SelectItem key={code} value={code}>
                        {currency.symbol} {code} - {currency.name || code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("primaryCurrencyDescription")}
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium mb-2">{t("multiCurrencySupport")}</p>
                <p className="text-xs text-muted-foreground">
                  {t("multiCurrencyDescription")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Link href="/changes" className="flex mt-6">
        <Button variant="ghost" className="w-full  mx-auto">
          <History className="mr-2 h-4 w-4" />
          Version 1.0.0
        </Button>
      </Link>
    </div>
  );
}
