import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isThisYear } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Smart timestamp formatting:
 * - Today: "2:34 PM"
 * - This year (not today): "Feb 15, 2:34 PM"
 * - Different year: "Feb 15 2024, 2:34 PM"
 */
export function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp)
  if (isToday(date)) {
    return format(date, "h:mm a")
  } else if (isThisYear(date)) {
    return format(date, "MMM d, h:mm a")
  } else {
    return format(date, "MMM d yyyy, h:mm a")
  }
}
