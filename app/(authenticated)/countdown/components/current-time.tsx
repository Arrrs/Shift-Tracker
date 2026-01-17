"use client";

import { useState, useEffect } from "react";
import { formatTime } from "../utils";
import { useTranslation } from "@/lib/i18n/use-translation";

interface CurrentTimeProps {
  use24Hour?: boolean;
  showSeconds?: boolean;
  className?: string;
}

export function CurrentTime({ use24Hour = true, showSeconds = true, className = "" }: CurrentTimeProps) {
  const { t, formatDate } = useTranslation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("currentTime")}</h3>
      <div className="text-6xl md:text-8xl font-bold tabular-nums tracking-tight">
        {formatTime(time, showSeconds, use24Hour)}
      </div>
      <div className="text-sm text-muted-foreground mt-2">
        {formatDate(time, { weekday: 'long', month: 'long', day: true })}
      </div>
    </div>
  );
}
