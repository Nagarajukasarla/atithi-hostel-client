/**
 * Currency formatting utilities for Atithi.
 */

export interface FormatCurrencyOptions {
    /** Currency symbol prefix (defaults to '₹') */
    symbol?: string;
    /** Number of decimal places (e.g. 0, 2). Passing boolean true uses 2, false uses 0 */
    decimals?: number | boolean;
    /** Minimum fraction digits (overrides decimals) */
    minimumFractionDigits?: number;
    /** Maximum fraction digits (overrides decimals) */
    maximumFractionDigits?: number;
    /** Locale for number formatting (defaults to 'en-IN') */
    locale?: string;
    /** Fallback string if value is null/undefined/NaN. If not provided, formats 0 with symbol & decimals */
    fallback?: string;
    /** Whether to add a space between currency symbol and number (defaults to false) */
    space?: boolean;
    /** Whether to format large values compactly (e.g. 1.5L, 25k) */
    compact?: boolean;
}

/**
 * Formats a numeric value into a localized currency string based on parameters.
 *
 * @param amount - The numeric amount (number, numeric string, null, or undefined)
 * @param options - Options object, or number/boolean shorthand for decimal places
 * @returns Localized formatted currency string
 *
 * @example
 * formatCurrency(8500) // "₹8,500"
 * formatCurrency(8500, 2) // "₹8,500.00"
 * formatCurrency(8500, { decimals: 2 }) // "₹8,500.00"
 * formatCurrency(8500, { symbol: "$", decimals: 2 }) // "$8,500.00"
 * formatCurrency(null) // "₹0"
 * formatCurrency(null, 2) // "₹0.00"
 * formatCurrency(null, { fallback: "—" }) // "—"
 */
export const formatCurrency = (
    amount: number | string | null | undefined,
    options?: number | boolean | FormatCurrencyOptions
): string => {
    let opts: FormatCurrencyOptions = {};

    if (typeof options === "number") {
        opts = { decimals: options };
    } else if (typeof options === "boolean") {
        opts = { decimals: options ? 2 : 0 };
    } else if (options && typeof options === "object") {
        opts = options;
    }

    const symbol = opts.symbol ?? "₹";
    const locale = opts.locale ?? "en-IN";
    const space = opts.space ? " " : "";

    // Determine decimal precision
    let minDecimals = opts.minimumFractionDigits;
    let maxDecimals = opts.maximumFractionDigits;

    if (minDecimals === undefined && maxDecimals === undefined) {
        if (typeof opts.decimals === "number") {
            minDecimals = opts.decimals;
            maxDecimals = opts.decimals;
        } else if (typeof opts.decimals === "boolean") {
            const d = opts.decimals ? 2 : 0;
            minDecimals = d;
            maxDecimals = d;
        } else {
            minDecimals = 0;
            maxDecimals = 0;
        }
    } else {
        if (minDecimals === undefined) minDecimals = maxDecimals ?? 0;
        if (maxDecimals === undefined) maxDecimals = minDecimals ?? 0;
    }

    // Handle null / undefined / empty
    if (amount === null || amount === undefined || amount === "") {
        if (opts.fallback !== undefined) {
            return opts.fallback;
        }
        const zeroStr = (0).toLocaleString(locale, {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals,
        });
        return `${symbol}${space}${zeroStr}`;
    }

    const num = Number(amount);
    if (isNaN(num)) {
        if (opts.fallback !== undefined) {
            return opts.fallback;
        }
        const zeroStr = (0).toLocaleString(locale, {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: maxDecimals,
        });
        return `${symbol}${space}${zeroStr}`;
    }

    // Compact notation if requested (e.g. for chart axes or badge summaries)
    if (opts.compact) {
        const abs = Math.abs(num);
        const sign = num < 0 ? "-" : "";
        if (abs >= 100000) {
            return `${sign}${symbol}${space}${(abs / 100000).toFixed(1)}L`;
        }
        if (abs >= 1000) {
            return `${sign}${symbol}${space}${(abs / 1000).toFixed(0)}k`;
        }
    }

    const formattedNum = num.toLocaleString(locale, {
        minimumFractionDigits: minDecimals,
        maximumFractionDigits: maxDecimals,
    });

    return `${symbol}${space}${formattedNum}`;
};

/**
 * Formats currency in compact Indian notation (e.g. ₹1.5L, ₹25k, ₹500).
 */
export const formatCompactCurrency = (
    amount: number | string | null | undefined,
    symbol = "₹"
): string => {
    return formatCurrency(amount, { symbol, compact: true });
};

