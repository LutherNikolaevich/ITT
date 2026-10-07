import { describe, expect, it } from 'vitest'
import type { TimeEntry } from '../types'
import type { DayFill } from './aggregate'
import { contributionsCalendar } from './contributions'

const entry = (date: string, timeIn: string, timeOut: string, breakMinutes = 0): TimeEntry => ({
  id: `${date}-${timeIn}`,
  date,
  timeIn,
  timeOut,
  breakMinutes,
  task: '',
  notes: '',
})

const TODAY = new Date(2026, 8, 16)

describe('contributionsCalendar', () => {
  it('starts on the Monday on or before the internship start month', () => {
    const weeks = contributionsCalendar([], 480, '2026-09-01', [], TODAY)
    expect(weeks[0].days[0]?.date).toBe('2026-08-31')
    expect(weeks[0].days).toHaveLength(7)
    expect(weeks).toHaveLength(3)
  })

  it('clamps a future start date to the current month', () => {
    const weeks = contributionsCalendar([], 480, '2027-01-01', [], TODAY)
    expect(weeks[0].days[0]?.date).toBe('2026-08-31')
  })

  it('ends on today with null placeholders for future days', () => {
    const weeks = contributionsCalendar([], 480, '2026-09-01', [], TODAY)
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
  })

  it('aggregates minutes from multiple entries on the same day', () => {
    const entries = [
      entry('2026-09-15', '08:00', '12:00'),
      entry('2026-09-15', '13:00', '17:00'),
    ]
    const weeks = contributionsCalendar(entries, 480, '2026-09-01', [], TODAY)
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-15')
    expect(day?.minutes).toBe(480)
    expect(day?.entries).toBe(2)
    expect(day?.level).toBe(4)
  })

  it('counts zero entries on days without logs', () => {
    const weeks = contributionsCalendar([], 480, '2026-09-01', [], TODAY)
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-15')
    expect(day?.entries).toBe(0)
  })

  it('maps minutes to levels against the daily target', () => {
    const entries = [
      entry('2026-09-01', '09:00', '10:00'),
      entry('2026-09-02', '09:00', '11:00'),
      entry('2026-09-03', '09:00', '13:00'),
      entry('2026-09-04', '09:00', '15:00'),
      entry('2026-09-05', '09:00', '17:00'),
    ]
    const weeks = contributionsCalendar(entries, 480, '2026-09-01', [], TODAY)
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
      entry('2026-09-01', '09:00', '11:00'),
      entry('2026-09-02', '09:00', '15:00'),
    ]
    const weeks = contributionsCalendar(entries, 0, '2026-09-01', [], TODAY)
    const byDate = new Map(
      weeks.flatMap((week) => week.days).map((day) => [day?.date, day?.level]),
    )
    expect(byDate.get('2026-09-01')).toBe(1)
    expect(byDate.get('2026-09-02')).toBe(4)
  })

  it('gives empty days level 0 even without a target', () => {
    const weeks = contributionsCalendar([], 0, '2026-09-01', [], TODAY)
    const levels = weeks
      .flatMap((week) => week.days)
      .filter((day) => day !== null)
      .map((day) => day.level)
    expect(new Set(levels)).toEqual(new Set([0]))
  })

  it('adds filled minutes to an undertime day and raises its level', () => {
    const entries = [entry('2026-09-14', '09:00', '11:00')]
    const fills: DayFill[] = [
      { date: '2026-09-14', kind: 'undertime', requiredMinutes: 360, filledMinutes: 360 },
    ]
    const weeks = contributionsCalendar(entries, 480, '2026-09-01', fills, TODAY)
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-14')
    expect(day?.minutes).toBe(480)
    expect(day?.entries).toBe(1)
    expect(day?.filled).toBe(360)
    expect(day?.level).toBe(4)
  })

  it('shows a filled absence day with no entries', () => {
    const fills: DayFill[] = [
      { date: '2026-09-14', kind: 'absence', requiredMinutes: 480, filledMinutes: 480 },
    ]
    const weeks = contributionsCalendar([], 480, '2026-09-01', fills, TODAY)
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-14')
    expect(day?.minutes).toBe(480)
    expect(day?.entries).toBe(0)
    expect(day?.filled).toBe(480)
    expect(day?.level).toBe(4)
  })

  it('ignores unfilled fill candidates', () => {
    const fills: DayFill[] = [
      { date: '2026-09-14', kind: 'absence', requiredMinutes: 480, filledMinutes: 0 },
    ]
    const weeks = contributionsCalendar([], 480, '2026-09-01', fills, TODAY)
    const day = weeks.flatMap((week) => week.days).find((day) => day?.date === '2026-09-14')
    expect(day?.minutes).toBe(0)
    expect(day?.filled).toBe(0)
    expect(day?.level).toBe(0)
  })
})
