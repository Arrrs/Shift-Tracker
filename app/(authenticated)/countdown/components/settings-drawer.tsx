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
            Customize your countdown page display and behavior
          </SheetDescription>
        </SheetHeader>

        <div className="h-px bg-border mb-2" />

        <div className="space-y-6 px-4 pb-6">
          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Display</h3>

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
                        24-Hour Format
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
                        Countdown Style
                      </Label>
                      <Select
                        value={settings.countdownStyle}
                        onValueChange={(value: any) =>
                          onSettingsChange({ countdownStyle: value })
                        }
                      >
                        <SelectTrigger id="countdown-style" className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">Digital</SelectItem>
                          <SelectItem value="cards">Cards</SelectItem>
                          <SelectItem value="compact">Compact</SelectItem>
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
                    Counter
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
                        Default Value
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
                        Starting value for the manual counter
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Shift Detection */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Shift Detection</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-1">
                <Label htmlFor="auto-detect" className="text-sm font-medium cursor-pointer">
                  Auto-detect active shift
                </Label>
                <Switch
                  id="auto-detect"
                  checked={settings.autoDetectShift}
                  onCheckedChange={(checked) =>
                    onSettingsChange({ autoDetectShift: checked })
                  }
                />
              </div>

              {!settings.autoDetectShift && (
                <div className="ml-6 pl-3 border-l-2 border-border">
                  <p className="text-sm text-muted-foreground">
                    Manual shift selection will be available in the main page
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
