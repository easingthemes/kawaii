const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

/**
 * Formats a Tina `datetime` value ("2026-04-06T00:00:00.000Z") in German.
 *
 * Reads the date out of the string instead of going through `new Date()`, for the
 * same reason as the events block: a Date is formatted in the viewer's timezone and
 * can land on a different day than the server picked — a hydration error, not just
 * a wrong date.
 */
export function formatDate(value?: string | null): string {
  if (!value) return '';
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${Number(day)}. ${MONTHS[Number(month) - 1]} ${year}`;
}
