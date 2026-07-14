/**
 * Gets the current date string (YYYY-MM-DD) in the specified timezone.
 */
export function getTodayStr(timezone: string, dateObj: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

/**
 * Gets the current time string (HH:MM:SS) in the specified timezone.
 */
export function getNowTimeStr(timezone: string, dateObj: Date = new Date()): string {
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(dateObj);

  const hour = timeParts.find((p) => p.type === "hour")?.value || "00";
  const minute = timeParts.find((p) => p.type === "minute")?.value || "00";
  const second = timeParts.find((p) => p.type === "second")?.value || "00";
  
  return `${hour}:${minute}:${second}`;
}

/**
 * Gets the current hour and minute in the specified timezone.
 */
export function getNowHourMinute(timezone: string, dateObj: Date = new Date()): { hour: number, minute: number } {
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(dateObj);

  const hour = parseInt(timeParts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(timeParts.find((p) => p.type === "minute")?.value || "0", 10);
  
  return { hour, minute };
}
