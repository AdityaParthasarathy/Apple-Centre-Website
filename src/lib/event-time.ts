// An event's time is stored as readable text — "2:00 PM" or "2:00 PM – 5:00 PM" —
// because that is exactly what every page, the calendar and the confirmation
// email show. The staff form collects it with two real time pickers (so
// letters can't be typed) and converts here; the API checks the same format,
// so nothing else can be saved either.

const TIME = '(?:1[0-2]|[1-9]):[0-5][0-9] (?:AM|PM)'
const VALID = new RegExp(`^${TIME}(?: \u2013 ${TIME})?$`)
const DASH = ' \u2013 '

/** "14:00" (a time input's value) -> "2:00 PM". Empty/invalid -> ''. */
function to12h(hhmm: string): string {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm)
  if (!m) return ''
  const hours = Number(m[1])
  return `${hours % 12 || 12}:${m[2]} ${hours >= 12 ? 'PM' : 'AM'}`
}

/** "2:00 PM" -> "14:00" so a stored value can fill a time input. */
function to24h(text: string): string {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(text)
  if (!m) return ''
  const hours12 = Number(m[1])
  if (hours12 < 1 || hours12 > 12 || Number(m[2]) > 59) return ''
  const hours = (hours12 % 12) + (m[3].toUpperCase() === 'PM' ? 12 : 0)
  return `${String(hours).padStart(2, '0')}:${m[2]}`
}

export function formatTimeRange(start: string, end?: string): string {
  const from = to12h(start)
  const to = end ? to12h(end) : ''
  return from && to ? `${from}${DASH}${to}` : from
}

/** Splits a stored time back into the two picker values. Anything that isn't
 *  in the expected shape (an old free-text entry) comes back empty, so
 *  editing that event asks for a real time instead of carrying junk forward. */
export function parseTimeRange(value: string): { start: string; end: string } {
  if (!VALID.test(value)) return { start: '', end: '' }
  const [from, to] = value.split(DASH)
  return { start: to24h(from), end: to ? to24h(to) : '' }
}

export function isValidEventTime(value: unknown): boolean {
  return typeof value === 'string' && VALID.test(value)
}
