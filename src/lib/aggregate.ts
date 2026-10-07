import type { Settings, TimeEntry } from '../types'
import { formatHours, totalMinutes } from './time'

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function entryMinutes(entry: TimeEntry): number {
  return totalMinutes(entry.timeIn, entry.timeOut, entry.breakMinutes)
}

export function totalRenderedMinutes(entries: TimeEntry[]): number {
  return entries.reduce((sum, entry) => sum + entryMinutes(entry), 0)
}

export function headerTitle(requiredHours: number, completedMinutes: number): string {
  if (requiredHours <= 0) return 'Set your goal to start tracking'
  const required = requiredHours * 60
  if (completedMinutes >= required) return 'Goal reached'
  return `${formatHours(completedMinutes)} of ${formatHours(required)} logged`
}

export function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  copy.setDate(copy.getDate() - day)
  return copy
}

export function minutesInRange(entries: TimeEntry[], fromKey: string, toKey: string): number {
  return entries
    .filter((entry) => entry.date >= fromKey && entry.date < toKey)
    .reduce((sum, entry) => sum + entryMinutes(entry), 0)
}

export function thisWeekMinutes(entries: TimeEntry[], now: Date = new Date()): number {
  const start = startOfWeek(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return minutesInRange(entries, dateKey(start), dateKey(end))
}

export type FillKind = 'holiday' | 'undertime' | 'absence'

export interface DayFill {
  date: string
  kind: FillKind
  requiredMinutes: number
  filledMinutes: number
}

export interface FillSummary {
  holidays: DayFill[]
  undertime: DayFill[]
  absences: DayFill[]
  filledCount: number
  filledUndertimeCount: number
  filledAbsenceCount: number
  remainingExcessMinutes: number
  completedMinutes: number
}

export function fillSummary(
  entries: TimeEntry[],
  settings: Settings,
  filledHolidays: string[] = [],
  filledUndertime: string[] = [],
  filledAbsences: string[] = [],
  now: Date = new Date(),
): FillSummary {
  const dailyRequired =
    settings.defaultDailyHours != null && settings.defaultDailyHours > 0
      ? settings.defaultDailyHours * 60
      : 0

  const byDay = new Map<string, number>()
  for (const entry of entries) {
    byDay.set(entry.date, (byDay.get(entry.date) ?? 0) + entryMinutes(entry))
  }

  let bank = 0
  let regular = 0
  if (dailyRequired <= 0) {
    regular = totalRenderedMinutes(entries)
  } else {
    for (const minutes of byDay.values()) {
      regular += Math.min(minutes, dailyRequired)
      bank += Math.max(0, minutes - dailyRequired)
    }
  }

  const candidates: DayFill[] = []
  const unworked = settings.holidays.filter((date) => !byDay.has(date)).sort()
  for (const date of unworked) {
    candidates.push({ date, kind: 'holiday', requiredMinutes: dailyRequired, filledMinutes: 0 })
  }
  if (dailyRequired > 0) {
    const short = [...byDay.entries()]
      .filter(([, minutes]) => minutes < dailyRequired)
      .map(([date]) => date)
      .sort()
    for (const date of short) {
      candidates.push({
        date,
        kind: 'undertime',
        requiredMinutes: dailyRequired - byDay.get(date)!,
        filledMinutes: 0,
      })
    }
  }

  const start = settings.startDate ? new Date(`${settings.startDate}T00:00:00`) : null
  if (dailyRequired > 0 && start && !Number.isNaN(start.getTime())) {
    const today = dateKey(now)
    const holidaySet = new Set(settings.holidays)
    for (const day = new Date(start); dateKey(day) < today; day.setDate(day.getDate() + 1)) {
      const key = dateKey(day)
      const weekend = day.getDay() === 0 || day.getDay() === 6
      if (!weekend && !holidaySet.has(key) && !byDay.has(key)) {
        candidates.push({ date: key, kind: 'absence', requiredMinutes: dailyRequired, filledMinutes: 0 })
      }
    }
  }
  candidates.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const selectedSets: Record<FillKind, Set<string>> = {
    holiday: new Set(filledHolidays),
    undertime: new Set(filledUndertime),
    absence: new Set(filledAbsences),
  }
  const buckets: Record<FillKind, DayFill[]> = { holiday: [], undertime: [], absence: [] }
  const counts: Record<FillKind, number> = { holiday: 0, undertime: 0, absence: 0 }
  let credit = 0
  for (const candidate of candidates) {
    const selected = selectedSets[candidate.kind].has(candidate.date)
    const used = selected ? Math.min(bank, candidate.requiredMinutes) : 0
    bank -= used
    credit += used
    buckets[candidate.kind].push({ ...candidate, filledMinutes: used })
    if (candidate.requiredMinutes > 0 && used >= candidate.requiredMinutes) counts[candidate.kind] += 1
  }

  return {
    holidays: buckets.holiday,
    undertime: buckets.undertime,
    absences: buckets.absence,
    filledCount: counts.holiday,
    filledUndertimeCount: counts.undertime,
    filledAbsenceCount: counts.absence,
    remainingExcessMinutes: bank,
    completedMinutes: regular + credit,
  }
}

export function thisMonthMinutes(entries: TimeEntry[], now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return minutesInRange(entries, dateKey(start), dateKey(end))
}
