import { useLanguage } from "./language-context";
import { translations, TranslationKey } from "./translations";

const WEEKDAY_KEYS: TranslationKey[] = [
  "weekdaySunday",
  "weekdayMonday",
  "weekdayTuesday",
  "weekdayWednesday",
  "weekdayThursday",
  "weekdayFriday",
  "weekdaySaturday",
];

const WEEKDAY_SHORT_KEYS: TranslationKey[] = [
  "weekdaySundayShort",
  "weekdayMondayShort",
  "weekdayTuesdayShort",
  "weekdayWednesdayShort",
  "weekdayThursdayShort",
  "weekdayFridayShort",
  "weekdaySaturdayShort",
];

const MONTH_KEYS: TranslationKey[] = [
  "monthJanuary",
  "monthFebruary",
  "monthMarch",
  "monthApril",
  "monthMay",
  "monthJune",
  "monthJuly",
  "monthAugust",
  "monthSeptember",
  "monthOctober",
  "monthNovember",
  "monthDecember",
];

const MONTH_SHORT_KEYS: TranslationKey[] = [
  "monthJanuaryShort",
  "monthFebruaryShort",
  "monthMarchShort",
  "monthAprilShort",
  "monthMayShort",
  "monthJuneShort",
  "monthJulyShort",
  "monthAugustShort",
  "monthSeptemberShort",
  "monthOctoberShort",
  "monthNovemberShort",
  "monthDecemberShort",
];

export interface DateFormatOptions {
  weekday?: "long" | "short";
  month?: "long" | "short";
  day?: boolean;
  year?: boolean;
}

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: TranslationKey): string => {
    return translations[language][key];
  };

  /**
   * Format a date using translated weekday and month names
   */
  const formatDate = (date: Date, options: DateFormatOptions = {}): string => {
    const parts: string[] = [];

    // Weekday
    if (options.weekday) {
      const dayIndex = date.getDay(); // 0 = Sunday
      const key = options.weekday === "long" ? WEEKDAY_KEYS[dayIndex] : WEEKDAY_SHORT_KEYS[dayIndex];
      parts.push(t(key));
    }

    // Month
    if (options.month) {
      const monthIndex = date.getMonth(); // 0 = January
      const key = options.month === "long" ? MONTH_KEYS[monthIndex] : MONTH_SHORT_KEYS[monthIndex];
      const monthName = t(key);

      // Day
      if (options.day) {
        parts.push(`${monthName} ${date.getDate()}`);
      } else {
        parts.push(monthName);
      }
    } else if (options.day) {
      parts.push(String(date.getDate()));
    }

    // Year
    if (options.year) {
      parts.push(String(date.getFullYear()));
    }

    // Join with comma for weekday, space for other parts
    if (options.weekday && parts.length > 1) {
      return `${parts[0]}, ${parts.slice(1).join(" ")}`;
    }
    return parts.join(" ");
  };

  return { t, language, formatDate };
}
