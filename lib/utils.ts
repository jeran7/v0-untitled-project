import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Format a number as percentage
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

/**
 * Format a date safely, handling string dates, invalid dates, and null/undefined values
 * @param date The date to format
 * @param format Optional format string: 'MM/dd/yy', 'MMM d', etc.
 */
export function formatDate(date: Date | string | null | undefined, format?: string): string {
  if (!date) return "N/A"

  try {
    // If it's a string, convert to Date object
    const dateObj = typeof date === "string" ? new Date(date) : date

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date"
    }

    // If format is specified, use it
    if (format) {
      switch (format) {
        case "MM/dd/yy":
          return new Intl.DateTimeFormat("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "2-digit",
          }).format(dateObj)
        case "MMM d":
          return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
          }).format(dateObj)
        default:
          return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }).format(dateObj)
      }
    }

    // Default format
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dateObj)
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Error"
  }
}
