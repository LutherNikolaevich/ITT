import { describe, expect, it } from 'vitest'
import type { TimeEntry } from '../types'
import { contributionsCalendar, streakStats } from './contributions'

const entry = (date: string, timeIn: string, timeOut: string, breakMinutes = 0): TimeEntry => ({
  id: `${date}-${timeIn}`,
  date,
  timeIn,
  timeOut,
  breakMinutes,
  task: '',
  notes: '',
})

describe('contributionsCalendar', () => {
  it('starts on the Monday on or before the first day, 11 months back', () => {
    const weeks = contributionsCalendar([], 480, new Date(2026, 8, 16))
    expect(weeks[0].days[0]?.date).toBe('2025-09-29')
    expect(weeks[0].days).toHaveLength(7)
  })

  it('ends on today with null placeholders for future days', () => {
    const weeks = contributionsCalendar([], 480, new Date(2026, 8, 16))
    const last = weeks[weeks.length - 1]
    expect(last.days.map((day) => day?.date ?? null)).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      null,
      null,
      null,
      null,
    ])
    expect(weeks).toHaveLength(51)
  })

  it('aggregates minutes from multiple entries on the same day', () => {
    const entries = [
      entry('2026-09-15', '08:00', '12:00'),
      entry('2026-09-15', '13:00', '17:00'),
    ]
    const weeks = contributionsCalendar(entries, 480, new Date(2026, 8, 16))
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-15')
    expect(day?.minutes).toBe(480)
    expect(day?.entries).toBe(2)
    expect(day?.level).toBe(4)
  })

  it('counts zero entries on days without logs', () => {
    const weeks = contributionsCalendar([], 480, new Date(2026, 8, 16))
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-15')
    expect(day?.entries).toBe(0)
  })

  it('maps minutes to levels against the daily target', () => {
    const entries = [
      entry('2026-09-01', '09:00', '10:00'), // 60m -> <25%
      entry('2026-09-02', '09:00', '11:00'), // 120m -> 25%
      entry('2026-09-03', '09:00', '13:00'), // 240m -> 50%
      entry('2026-09-04', '09:00', '15:00'), // 360m -> 75%
      entry('2026-09-05', '09:00', '17:00'), // 480m -> 100%
    ]
    const weeks = contributionsCalendar(entries, 480, new Date(2026, 8, 16))
    const byDate = new Map(
      weeks.flatMap((week) => week.days).map((day) => [day?.date, day?.level]),
    )
    expect(byDate.get('2026-09-01')).toBe(1)
    expect(byDate.get('2026-09-02')).toBe(1)
    expect(byDate.get('2026-09-03')).toBe(2)
    expect(byDate.get('2026-09-04')).toBe(3)
    expect(byDate.get('2026-09-05')).toBe(4)
    expect(byDate.get('2026-09-07')).toBe(0)
  })

  it('scales against the busiest day when there is no daily target', () => {
    const entries = [
      entry('2026-09-01', '09:00', '11:00'), // 120m
      entry('2026-09-02', '09:00', '15:00'), // 360m
    ]
    const weeks = contributionsCalendar(entries, 0, new Date(2026, 8, 16))
    const byDate = new Map(
      weeks.flatMap((week) => week.days).map((day) => [day?.date, day?.level]),
    )
    expect(byDate.get('2026-09-01')).toBe(1)
    expect(byDate.get('2026-09-02')).toBe(4)
  })

  it('gives empty days level 0 even without a target', () => {
    const weeks = contributionsCalendar([], 0, new Date(2026, 8, 16))
    const levels = weeks
      .flatMap((week) => week.days)
      .filter((day) => day !== null)
      .map((day) => day.level)
    expect(new Set(levels)).toEqual(new Set([0]))
  })

  it('computes current, longest streaks and active days', () => {
    const entries = [
      entry('2026-09-14', '09:00', '10:00'),
      entry('2026-09-15', '09:00', '10:00'),
      entry('2026-09-16', '09:00', '10:00'),
      entry('2026-09-11', '09:00', '12:00'),
      entry('2026-09-10', '09:00', '12:00'),
    ]
    const weeks = contributionsCalendar(entries, 480, new Date(2026, 8, 16))
    expect(streakStats(weeks)).toEqual({ current: 3, longest: 3, activeDays: 5 })
  })

  it('keeps the current streak alive when today is not logged yet', () => {
    const entries = [
      entry('2026-09-14', '09:00', '10:00'),
      entry('2026-09-15', '09:00', '10:00'),
    ]
    const weeks = contributionsCalendar(entries, 480, new Date(2026, 8, 16))
    expect(streakStats(weeks).current).toBe(2)
  })

  it('breaks the streak once the previous day is also empty', () => {
    const entries = [entry('2026-09-13', '09:00', '10:00')]
    const weeks = contributionsCalendar(entries, 480, new Date(2026, 8, 16))
    expect(streakStats(weeks).current).toBe(0)
  })

  it('finds the longest streak even when the current one is shorter', () => {
    const entries = [
      entry('2025-10-06', '09:00', '10:00'),
      entry('2025-10-07', '09:00', '10:00'),
      entry('2025-10-08', '09:00', '10:00'),
      entry('2025-10-09', '09:00', '10:00'),
      entry('2026-09-16', '09:00', '10:00'),
    ]
    const weeks = contributionsCalendar(entries, 480, new Date(2026, 8, 16))
    expect(streakStats(weeks)).toEqual({ current: 1, longest: 4, activeDays: 5 })
  })

  it('returns zeros for an empty calendar', () => {
    const weeks = contributionsCalendar([], 480, new Date(2026, 8, 16))
    expect(streakStats(weeks)).toEqual({ current: 0, longest: 0, activeDays: 0 })
  })
})
