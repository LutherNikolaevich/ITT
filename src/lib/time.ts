const MIN_PER_HOUR = 60

export function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * MIN_PER_HOUR + m
}

export function spanMinutes(timeIn: string, timeOut: string): number {
  return parseMinutes(timeOut) - parseMinutes(timeIn)
}

export function totalMinutes(timeIn: string, timeOut: string, breakMinutes: number): number {
  return Math.max(0, spanMinutes(timeIn, timeOut) - breakMinutes)
}

export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / MIN_PER_HOUR) % 24
  const m = minutes % MIN_PER_HOUR
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function overlaps(
  a: { date: string; timeIn: string; timeOut: string },
  b: { date: string; timeIn: string; timeOut: string },
): boolean {
  if (a.date !== b.date) return false
  const aIn = parseMinutes(a.timeIn)
  const aOut = parseMinutes(a.timeOut)
  const bIn = parseMinutes(b.timeIn)
  const bOut = parseMinutes(b.timeOut)
  if (![aIn, aOut, bIn, bOut].every(Number.isFinite)) return false
  return aIn < bOut && bIn < aOut
}

export function formatHours(minutes: number): string {
  const h = Math.round((minutes / MIN_PER_HOUR) * 100) / 100
  return `${h} h`
}
