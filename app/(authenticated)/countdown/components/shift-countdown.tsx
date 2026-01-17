"use client";

import { ActiveShift, CountdownStyle } from "../types";
import { useCountdown } from "../hooks/use-countdown";
import { useTranslation } from "@/lib/i18n/use-translation";
import { Card } from "@/components/ui/card";

interface ShiftCountdownProps {
  activeShift: ActiveShift | null;
  style?: CountdownStyle;
}

export function ShiftCountdown({ activeShift, style = 'digital' }: ShiftCountdownProps) {
  const { t } = useTranslation();
  const countdown = useCountdown(activeShift);

  if (!activeShift) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{t("noActiveShift")}</p>
      </Card>
    );
  }

  if (activeShift.status === 'notStarted') {
    const shiftName = activeShift.entry.jobs?.name || t("shift");
    return (
      <Card className="p-8 text-center">
        <p className="text-lg text-muted-foreground">
          {t("shiftNotStartedYet")} <span className="font-semibold">{shiftName}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {t("startsAt")}: {activeShift.startTime.toLocaleTimeString()}
        </p>
      </Card>
    );
  }

  if (activeShift.status === 'ended') {
    const shiftName = activeShift.entry.jobs?.name || t("shift");
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-semibold">{t("shiftEnded")}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {shiftName}
        </p>
      </Card>
    );
  }

  // Render different styles
  switch (style) {
    case 'cards':
      return <CountdownCards countdown={countdown} activeShift={activeShift} />;
    case 'compact':
      return <CountdownCompact countdown={countdown} activeShift={activeShift} />;
    default:
      return <CountdownDigital countdown={countdown} activeShift={activeShift} />;
  }
}

function CountdownDigital({ countdown, activeShift }: { countdown: ReturnType<typeof useCountdown>; activeShift: ActiveShift }) {
  const { t } = useTranslation();
  const shiftName = activeShift.entry.jobs?.name || t("shift");

  return (
    <Card className="p-6 md:p-8">
      <h3 className="text-sm md:text-base font-medium text-muted-foreground mb-4 text-center">
        {t("untilShiftEnd")} - {shiftName}
      </h3>
      <div className="text-5xl md:text-7xl font-bold text-center tabular-nums tracking-tight text-primary">
        {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
      </div>
      <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
        <span>{t("hours")}</span>
        <span>{t("minutes")}</span>
        <span>{t("seconds")}</span>
      </div>
    </Card>
  );
}

function CountdownCards({ countdown, activeShift }: { countdown: ReturnType<typeof useCountdown>; activeShift: ActiveShift }) {
  const { t } = useTranslation();
  const shiftName = activeShift.entry.jobs?.name || t("shift");

  return (
    <Card className="p-6 md:p-8">
      <h3 className="text-sm md:text-base font-medium text-muted-foreground mb-6 text-center">
        {t("untilShiftEnd")} - {shiftName}
      </h3>
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
          <div className="text-3xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
            {countdown.hours}
          </div>
          <div className="text-xs mt-2 text-muted-foreground">{t("hours")}</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
          <div className="text-3xl md:text-5xl font-bold text-green-600 dark:text-green-400 tabular-nums">
            {countdown.minutes}
          </div>
          <div className="text-xs mt-2 text-muted-foreground">{t("minutes")}</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-center">
          <div className="text-3xl md:text-5xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {countdown.seconds}
          </div>
          <div className="text-xs mt-2 text-muted-foreground">{t("seconds")}</div>
        </div>
      </div>
    </Card>
  );
}

function CountdownCompact({ countdown, activeShift }: { countdown: ReturnType<typeof useCountdown>; activeShift: ActiveShift }) {
  const { t } = useTranslation();
  const shiftName = activeShift.entry.jobs?.name || t("shift");

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{shiftName}</h3>
          <p className="text-xs text-muted-foreground">{t("untilShiftEnd")}</p>
        </div>
        <div className="text-2xl md:text-4xl font-bold tabular-nums text-primary">
          {countdown.hours > 0 && `${countdown.hours}h `}
          {countdown.minutes}m {countdown.seconds}s
        </div>
      </div>
    </Card>
  );
}
