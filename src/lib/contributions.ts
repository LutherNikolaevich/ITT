import type { TimeEntry } from '../types'
import { dateKey, entryMinutes, startOfWeek } from './aggregate'

export interface CalendarDay {
  date: string
  minutes: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface CalendarWeek {
  days: Array<CalendarDay | null>
}

function levelFor(minutes: number, required: number): CalendarDay['level'] {
  if (minutes <= 0) return 0
  const ratio = minutes / required
  if (ratio >= 1) return 4
  if (ratio >= 0.75) return 3
  if (ratio >= 0.5) return 2
  return 1
}

export function contributionsCalendar(
  entries: TimeEntry[],
  dailyRequiredMinutes: number,
  today: Date = new Date(),
): CalendarWeek[] {
  const byDate = new Map<string, number>()
  for (const entry of entries) {
    byDate.set(entry.date, (byDate.get(entry.date) ?? 0) + entryMinutes(entry))
  }

  let peak = 0
  for (const minutes of byDate.values()) {
    peak = Math.max(peak, minutes)
  }
  const required = dailyRequiredMinutes > 0 ? dailyRequiredMinutes : peak

  const firstOfMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1)
  const todayKey = dateKey(today)
  const weeks: CalendarWeek[] = []
  let cursor = startOfWeek(firstOfMonth)
  while (dateKey(cursor) <= todayKey) {
    const days: Array<CalendarDay | null> = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor)
      day.setDate(day.getDate() + i)
      const key = dateKey(day)
      if (key > todayKey) {
        days.push(null)
        continue
      }
      const minutes = byDate.get(key) ?? 0
      days.push({ date: key, minutes, level: levelFor(minutes, required) })
    }
    weeks.push({ days })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}
