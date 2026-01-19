"use client";

import { CountdownSettings } from "../types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/use-translation";

interface SettingsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: CountdownSettings;
  onSettingsChange: (settings: Partial<CountdownSettings>) => void;
}

export function SettingsDrawer({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: SettingsDrawerProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-1 pb-2">
          <SheetTitle className="text-xl">{t("settings")}</SheetTitle>
          <SheetDescription>
            {t("customizeCountdownDisplay")}
          </SheetDescription>
        </SheetHeader>

        <div className="h-px bg-border mb-2" />

        <div className="space-y-6 px-4 pb-6">
          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">{t("display")}</h3>

            <div className="space-y-4">
              {/* Current Time Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="show-clock" className="text-sm font-medium cursor-pointer">
                    {t("currentTime")}
                  </Label>
                  <Switch
                    id="show-clock"
                    checked={settings.showClock}
                    onCheckedChange={(checked) =>
                      onSettingsChange({ showClock: checked })
                    }
                  />
                </div>

                {settings.showClock && (
                  <div className="ml-6 pl-3 border-l-2 border-border space-y-3">
                    <div className="flex items-center justify-between py-1">
                      <Label htmlFor="24-hour" className="text-sm cursor-pointer">
                        {t("twentyFourHourFormat")}
                      </Label>
                      <Switch
                        id="24-hour"
                        checked={settings.use24Hour}
                        onCheckedChange={(checked) =>
                          onSettingsChange({ use24Hour: checked })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Countdown Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="show-countdown" className="text-sm font-medium cursor-pointer">
                    {t("countdown")}
                  </Label>
                  <Switch
                    id="show-countdown"
                    checked={settings.showCountdown}
                    onCheckedChange={(checked) =>
                      onSettingsChange({ showCountdown: checked })
                    }
                  />
                </div>

                {settings.showCountdown && (
                  <div className="ml-6 pl-3 border-l-2 border-border space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="countdown-style" className="text-sm">
                        {t("countdownStyle")}
                      </Label>
                      <Select
                        value={settings.countdownStyle}
                        onValueChange={(value: "digital" | "cards" | "compact") =>
                          onSettingsChange({ countdownStyle: value })
                        }
                      >
                        <SelectTrigger id="countdown-style" className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">{t("digital")}</SelectItem>
                          <SelectItem value="cards">{t("cards")}</SelectItem>
                          <SelectItem value="compact">{t("compact")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Counter Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="show-counter" className="text-sm font-medium cursor-pointer">
                    {t("counter")}
                  </Label>
                  <Switch
                    id="show-counter"
                    checked={settings.showCounter}
                    onCheckedChange={(checked) =>
                      onSettingsChange({ showCounter: checked })
                    }
                  />
                </div>

                {settings.showCounter && (
                  <div className="ml-6 pl-3 border-l-2 border-border">
                    <div className="space-y-2">
                      <Label htmlFor="counter-default" className="text-sm">
                        {t("defaultValue")}
                      </Label>
                      <Input
                        id="counter-default"
                        type="number"
                        min={0}
                        max={10}
                        className="h-10"
                        value={settings.counterDefaultValue}
                        onChange={(e) =>
                          onSettingsChange({
                            counterDefaultValue: parseInt(e.target.value) || 3,
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("startingValueForCounter")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
