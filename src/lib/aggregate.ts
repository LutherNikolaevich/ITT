import type { Settings, TimeEntry } from '../types'
import { formatHours, parseMinutes } from './time'

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function entryMinutes(entry: TimeEntry): number {
  const span = parseMinutes(entry.timeOut) - parseMinutes(entry.timeIn)
  return Math.max(0, span - entry.breakMinutes)
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

export interface HolidayFill {
  date: string
  requiredMinutes: number
  filledMinutes: number
}

export interface HolidaySummary {
  holidays: HolidayFill[]
  filledCount: number
  remainingExcessMinutes: number
  completedMinutes: number
}

export function holidaySummary(
  entries: TimeEntry[],
  settings: Settings,
  filledDates: string[] = [],
): HolidaySummary {
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

  const selected = new Set(filledDates)
  const unworked = settings.holidays.filter((date) => !byDay.has(date)).sort()
  const holidays: HolidayFill[] = []
  let credit = 0
  let filledCount = 0
  for (const date of unworked) {
    const used = selected.has(date) ? Math.min(bank, dailyRequired) : 0
    bank -= used
    credit += used
    if (dailyRequired > 0 && used >= dailyRequired) filledCount += 1
    holidays.push({ date, requiredMinutes: dailyRequired, filledMinutes: used })
  }

  return {
    holidays,
    filledCount,
    remainingExcessMinutes: bank,
    completedMinutes: regular + credit,
  }
}

export function thisMonthMinutes(entries: TimeEntry[], now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return minutesInRange(entries, dateKey(start), dateKey(end))
}
