import type { TimeEntry } from '../types'
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

export function headerTitle(requiredHours: number, entries: TimeEntry[]): string {
  if (requiredHours <= 0) return 'Set your goal to start tracking'
  const required = requiredHours * 60
  const total = totalRenderedMinutes(entries)
  if (total >= required) return 'Goal reached'
  return `${formatHours(total)} of ${formatHours(required)} logged`
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

export function thisMonthMinutes(entries: TimeEntry[], now: Date = new Date()): number {
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return minutesInRange(entries, dateKey(start), dateKey(end))
}
