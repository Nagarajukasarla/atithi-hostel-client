/**
 * Date formatting and manipulation utilities for Atithi.
 */

export type DatePreset =
    | "default" // 5 Nov 2026
    | "2-digit" // 05 Nov 2026
    | "short" // 05/11/2026
    | "medium" // 05 Nov, 2026
    | "long" // 5 November 2026
    | "full" // Thursday, 5 November 2026
    | "month-year" // Nov 2026
    | "datetime" // 5 Nov 2026, 02:30 PM
    | "datetime-2-digit" // 05 Nov 2026, 02:30 PM
    | "time"; // 02:30 PM

export interface FormatDateOptions extends Intl.DateTimeFormatOptions {
    /** Preset format name */
    preset?: DatePreset;
    /** Fallback string for null, undefined, or invalid dates (defaults to '—') */
    fallback?: string;
    /** Locale, defaults to 'en-IN' */
    locale?: string;
}

const PRESET_OPTIONS: Record<DatePreset, Intl.DateTimeFormatOptions> = {
    default: { day: "numeric", month: "short", year: "numeric" },
    "2-digit": { day: "2-digit", month: "short", year: "numeric" },
    short: { day: "2-digit", month: "2-digit", year: "numeric" },
    medium: { day: "numeric", month: "short", year: "numeric" },
    long: { day: "numeric", month: "long", year: "numeric" },
    full: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
    "month-year": { month: "short", year: "numeric" },
    datetime: {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    },
    "datetime-2-digit": {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    },
    time: { hour: "2-digit", minute: "2-digit" },
};

/**
 * Safely parses any date input (string, timestamp, or Date) into a valid Date object.
 * Correctly avoids UTC timezone drift for date-only 'YYYY-MM-DD' strings.
 */
export const parseDate = (dateInput: string | number | Date | null | undefined): Date | null => {
    if (!dateInput && dateInput !== 0) return null;

    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    if (typeof dateInput === "number") {
        const d = new Date(dateInput);
        return isNaN(d.getTime()) ? null : d;
    }

    const trimmed = String(dateInput).trim();
    if (!trimmed) return null;

    // Check for date-only pattern YYYY-MM-DD to avoid UTC midnight shifting to previous day in local timezone
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (dateOnlyMatch) {
        const year = Number(dateOnlyMatch[1]);
        const month = Number(dateOnlyMatch[2]) - 1;
        const day = Number(dateOnlyMatch[3]);
        const d = new Date(year, month, day);
        return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
};

/**
 * Formats a date string, timestamp, or Date object into a localized date string based on parameters.
 *
 * @param dateInput - The date to format (string, number, Date, null, or undefined)
 * @param options - Preset name (e.g. 'default', '2-digit', 'short', 'long', 'datetime') or custom FormatDateOptions
 * @returns Localized formatted date string, or fallback string if invalid/empty
 *
 * @example
 * formatDate("2026-11-05") // "5 Nov 2026"
 * formatDate("2026-11-05", "2-digit") // "05 Nov 2026"
 * formatDate("2026-11-05", { day: "2-digit", month: "long" }) // "05 November"
 * formatDate(null) // "—"
 * formatDate(null, { fallback: "N/A" }) // "N/A"
 */
export const formatDate = (
    dateInput: string | number | Date | null | undefined,
    options?: DatePreset | FormatDateOptions
): string => {
    const opts: FormatDateOptions =
        typeof options === "string" ? { preset: options } : options || {};

    const fallback = opts.fallback ?? "—";
    const locale = opts.locale ?? "en-IN";

    if (!dateInput && dateInput !== 0) {
        return fallback;
    }

    const parsed = parseDate(dateInput);
    if (!parsed) {
        return typeof dateInput === "string" ? dateInput : fallback;
    }

    const presetName = opts.preset ?? "default";
    const baseFormat = PRESET_OPTIONS[presetName] || PRESET_OPTIONS.default;

    const { preset: _preset, fallback: _fallback, locale: _locale, ...formatOverrides } = opts;
    const finalFormat: Intl.DateTimeFormatOptions = {
        ...baseFormat,
        ...formatOverrides,
    };

    try {
        return parsed.toLocaleDateString(locale, finalFormat);
    } catch {
        return typeof dateInput === "string" ? dateInput : fallback;
    }
};

/**
 * Formats a date with time.
 */
export const formatDateTime = (
    dateInput: string | number | Date | null | undefined,
    options?: FormatDateOptions
): string => {
    return formatDate(dateInput, { preset: "datetime", ...options });
};

/**
 * Returns today's date formatted as 'YYYY-MM-DD' for date inputs.
 */
export const getTodayDateString = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

/**
 * Calculates number of days between two dates (minimum 1 day).
 */
export const calculateDaysBetween = (
    startDate: string | number | Date | null | undefined,
    endDate?: string | number | Date | null | undefined
): number => {
    const start = parseDate(startDate);
    if (!start) return 1;
    const end = parseDate(endDate) || new Date();
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
};

