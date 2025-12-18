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
  clockType: 'analog' | 'digital';
  clockStyle: ClockStyle;
  digitalClockStyle: DigitalClockStyle;
  use24Hour: boolean;

  // Countdown settings
  countdownStyle: CountdownStyle;

  // Counter settings
  counterDefaultValue: number;

  // Auto-detection
  autoDetectShift: boolean;
  selectedJobId: string | null;
  selectedTemplateId: string | null;
}

export type ClockStyle = 'modern' | 'classic' | 'minimal' | 'elegant' | 'neon';

export type DigitalClockStyle = 'default' | 'lcd' | 'neon' | 'segment' | 'flip' | 'minimal';

export type CountdownStyle = 'digital' | 'cards' | 'text' | 'progress' | 'circular' | 'flip' | 'compact';

export interface ActiveShift {
  entry?: TimeEntry;
  template?: ShiftTemplate;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'notStarted' | 'ended';
  source: 'entry' | 'template' | 'none';
}

export interface ShiftCompletionData {
  actualHours: number;
  useTemplateHours: boolean;
  manualHours?: number;
  notes?: string;
}
