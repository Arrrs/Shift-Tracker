"use client";

import { useState, useEffect } from "react";
import { CurrentTime } from "./components/current-time";
import { ShiftCountdown } from "./components/shift-countdown";
import { BreakCounter } from "./components/break-counter";
import { SettingsDrawer } from "./components/settings-drawer";
import { AddTimeEntryDialog } from "../calendar/add-time-entry-dialog";
import { useCurrentShift } from "./hooks/use-current-shift";
import { CountdownSettings } from "./types";
import { Button } from "@/components/ui/button";
import { Settings, Play, CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Loader2 } from "lucide-react";
import { completeShift, loadCountdownSettings, saveCountdownSettings } from "./actions";
import { toast } from "sonner";

const DEFAULT_SETTINGS: CountdownSettings = {
  showClock: true,
  showCountdown: true,
  showCounter: true,
  use24Hour: true,
  countdownStyle: 'digital',
  counterDefaultValue: 3,
};

export default function CountdownPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<CountdownSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [completingShift, setCompletingShift] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startShiftOpen, setStartShiftOpen] = useState(false);

  const { activeShift, loading, refresh } = useCurrentShift();

  // Load settings from database and localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try loading from database first
        const result = await loadCountdownSettings();

        if (result.settings) {
          const dbSettings = { ...DEFAULT_SETTINGS, ...result.settings };
          setSettings(dbSettings);
          // Sync to localStorage as backup
          localStorage.setItem('countdown_settings', JSON.stringify(dbSettings));
        } else {
          // Fall back to localStorage if no DB settings
          const stored = localStorage.getItem('countdown_settings');
          if (stored) {
            const localSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
            setSettings(localSettings);
            // Save to database for future use
            await saveCountdownSettings(localSettings);
          }
        }
      } catch (e) {
        console.error('Failed to load countdown settings', e);
        // Fall back to localStorage on error
        const stored = localStorage.getItem('countdown_settings');
        if (stored) {
          try {
            setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
          } catch (parseError) {
            console.error('Failed to parse localStorage settings', parseError);
          }
        }
      } finally {
        // Mark settings as loaded regardless of success/failure
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to both localStorage and database
  const updateSettings = async (newSettings: Partial<CountdownSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    // Save to localStorage immediately for instant persistence
    localStorage.setItem('countdown_settings', JSON.stringify(updated));

    // Save to database asynchronously
    try {
      await saveCountdownSettings(updated);
    } catch (error) {
      console.error('Failed to save settings to database:', error);
      // Settings are still saved in localStorage, so we don't show an error to the user
    }
  };

  const handleCompleteShift = async () => {
    if (!activeShift?.entry) {
      toast.error(t("noActiveShift"));
      return;
    }

    setCompletingShift(true);
    try {
      const result = await completeShift({
        entryId: activeShift.entry.id,
        useTemplateHours: false,
      });

      if (result.error) {
        toast.error(t("failedToCompleteShift"), { description: result.error });
      } else {
        toast.success(t("shiftCompletedSuccessfully"));
        refresh();
      }
    } catch (error) {
      toast.error(t("failedToCompleteShift"));
    } finally {
      setCompletingShift(false);
    }
  };

  if (loading || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8" suppressHydrationWarning>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t("countdown")}</h1>
        <div className="flex gap-2">
          {activeShift?.status === 'ended' && activeShift.entry && (
            <Button
              onClick={handleCompleteShift}
              disabled={completingShift}
              size="sm"
              className="gap-2"
            >
              {completingShift ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {t("markAsCompleted")}
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        <div className="space-y-4">
          {/* Current Time */}
          {settings.showClock && (
            <CurrentTime use24Hour={settings.use24Hour} />
          )}

          {/* Shift Countdown */}
          {settings.showCountdown && (
            <ShiftCountdown activeShift={activeShift} style={settings.countdownStyle} />
          )}

          {/* Counter */}
          {settings.showCounter && (
            <BreakCounter
              defaultValue={settings.counterDefaultValue}
            />
          )}
        </div>

        {/* Quick Actions */}
        {!activeShift && (
          <div className="flex justify-center mt-6">
            <Button size="lg" className="gap-2" onClick={() => setStartShiftOpen(true)}>
              <Play className="h-5 w-5" />
              {t("startShiftNow")}
            </Button>
          </div>
        )}
      </div>

      {/* Settings Drawer */}
      <SettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={updateSettings}
      />

      {/* Add Time Entry Dialog */}
      <AddTimeEntryDialog
        open={startShiftOpen}
        onOpenChange={setStartShiftOpen}
        initialDate={(() => {
          const today = new Date();
          return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        })()}
        onSuccess={refresh}
      />
    </div>
  );
}
