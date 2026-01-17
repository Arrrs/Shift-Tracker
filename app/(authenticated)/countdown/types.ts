import { Database } from "@/lib/database.types";

export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"] | null;
  shift_templates: Database["public"]["Tables"]["shift_templates"]["Row"] | null;
};

export type ShiftTemplate = Database["public"]["Tables"]["shift_templates"]["Row"] & {
  jobs: Database["public"]["Tables"]["jobs"]["Row"];
};

export type Job = Database["public"]["Tables"]["jobs"]["Row"];

export interface CountdownSettings {
  // Display settings
  showClock: boolean;
  showCountdown: boolean;
  showCounter: boolean;

  // Clock settings
  use24Hour: boolean;

  // Countdown settings
  countdownStyle: CountdownStyle;

  // Counter settings
  counterDefaultValue: number;
}

export type CountdownStyle = 'digital' | 'cards' | 'compact';

export interface ActiveShift {
  entry: TimeEntry;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'notStarted' | 'ended';
}

export interface ShiftCompletionData {
  actualHours: number;
  useTemplateHours: boolean;
  manualHours?: number;
  notes?: string;
}
