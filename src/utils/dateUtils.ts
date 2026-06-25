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
