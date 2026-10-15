/**
 * Utility for formatting dates to day-month-year format (DD/MM/YYYY).
 */
export function formatAppDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  
  // Clean up any potential whitespace
  let trimmed = dateStr.trim();
  
  // Strip any time part if it is an ISO string to avoid timezone shifting
  if (trimmed.includes('T')) {
    trimmed = trimmed.split('T')[0];
  }
  
  // Check if it's already in DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  // Check if it's in YYYY-MM-DD
  const ymdRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = trimmed.match(ymdRegex);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }

  // Handle ISO strings (e.g. 2026-06-12T02:42:14-07:00)
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {
    // fallback to original string
  }

  return trimmed;
}

export function getBaseEventId(eventId: string): string {
  if (eventId.endsWith('-main')) return eventId.slice(0, -5);
  if (eventId.endsWith('-alternate')) return eventId.slice(0, -10);
  return eventId;
}

export function getTodayLocalYMD(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeDateToYMD(dateStr?: string | null): string {
  if (!dateStr) return '';
  let d = dateStr.trim();
  if (d.includes('T')) {
    d = d.split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [day, month, year] = d.split('/');
    return `${year}-${month}-${day}`;
  }
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch {
    // fallback
  }
  return d;
}

export function isEventEnded(e: { date: string; endDate?: string; status?: string }): boolean {
  if (e.status === 'Completed') return true;
  const targetDateStr = e.endDate || e.date;
  if (!targetDateStr) return false;
  const dateToCompare = normalizeDateToYMD(targetDateStr);
  const todayStr = getTodayLocalYMD();
  return Boolean(dateToCompare && dateToCompare < todayStr);
}

export function isEventLive(e: { date: string; endDate?: string; status?: string }): boolean {
  if (e.status === 'Live') return true;
  if (e.status === 'Completed') return false;

  const todayStr = getTodayLocalYMD();
  const startYMD = normalizeDateToYMD(e.date);
  const endYMD = normalizeDateToYMD(e.endDate || e.date);

  if (startYMD && endYMD) {
    return todayStr >= startYMD && todayStr <= endYMD;
  } else if (startYMD) {
    return todayStr === startYMD;
  }
  return false;
}

