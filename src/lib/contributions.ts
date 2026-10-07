import type { TimeEntry } from '../types'
import { dateKey, entryMinutes, startOfWeek, type DayFill } from './aggregate'

export interface CalendarDay {
  date: string
  minutes: number
  entries: number
  filled: number
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
  startDate: string | undefined,
  fills: DayFill[] = [],
  today: Date = new Date(),
): CalendarWeek[] {
  const byDate = new Map<string, { minutes: number; entries: number }>()
  for (const entry of entries) {
    const day = byDate.get(entry.date) ?? { minutes: 0, entries: 0 }
    day.minutes += entryMinutes(entry)
    day.entries += 1
    byDate.set(entry.date, day)
  }
  const filledByDate = new Map<string, number>()
  for (const fill of fills) {
    filledByDate.set(fill.date, (filledByDate.get(fill.date) ?? 0) + fill.filledMinutes)
  }

  let peak = 0
  for (const day of byDate.values()) {
    peak = Math.max(peak, day.minutes)
  }
  const required = dailyRequiredMinutes > 0 ? dailyRequiredMinutes : peak

  const todayKey = dateKey(today)
  const parsedStart = startDate ? new Date(`${startDate}T00:00:00`) : null
  const start = parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : today
  const firstOfMonth = new Date(Math.min(start.getTime(), today.getTime()))
  firstOfMonth.setDate(1)
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
      const logged = byDate.get(key) ?? { minutes: 0, entries: 0 }
      const filled = filledByDate.get(key) ?? 0
      const minutes = logged.minutes + filled
      days.push({
        date: key,
        minutes,
        entries: logged.entries,
        filled,
        level: levelFor(minutes, required),
      })
    }
    weeks.push({ days })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}
