import type { TimeEntry } from '../types'
import { dateKey, entryMinutes, startOfWeek } from './aggregate'

export interface CalendarDay {
  date: string
  minutes: number
  entries: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface CalendarWeek {
  days: Array<CalendarDay | null>
}

export interface StreakStats {
  current: number
  longest: number
  activeDays: number
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
  const byDate = new Map<string, { minutes: number; entries: number }>()
  for (const entry of entries) {
    const day = byDate.get(entry.date) ?? { minutes: 0, entries: 0 }
    day.minutes += entryMinutes(entry)
    day.entries += 1
    byDate.set(entry.date, day)
  }

  let peak = 0
  for (const day of byDate.values()) {
    peak = Math.max(peak, day.minutes)
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
      const logged = byDate.get(key) ?? { minutes: 0, entries: 0 }
      days.push({ date: key, ...logged, level: levelFor(logged.minutes, required) })
    }
    weeks.push({ days })
    cursor = new Date(cursor)
    cursor.setDate(cursor.getDate() + 7)
  }
  return weeks
}

export function streakStats(weeks: CalendarWeek[]): StreakStats {
  const days = weeks.flatMap((week) => week.days).filter((day) => day !== null)
  let longest = 0
  let run = 0
  for (const day of days) {
    run = day.minutes > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }

  const last = days.length - 1
  const todayLogged = last >= 0 && days[last].minutes > 0
  const current = todayLogged ? run : streakEndingAt(days, last - 1)

  return { current, longest, activeDays: days.filter((day) => day.minutes > 0).length }
}

function streakEndingAt(days: CalendarDay[], index: number): number {
  let count = 0
  for (let i = index; i >= 0 && days[i].minutes > 0; i--) {
    count++
  }
  return count
}
