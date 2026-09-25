import { useState } from 'react'
import type { CalendarDay, CalendarWeek } from '../lib/contributions'
import { streakStats } from '../lib/contributions'
import { dateKey } from '../lib/aggregate'
import { formatHours } from '../lib/time'

interface ContributionsCalendarProps {
  weeks: CalendarWeek[]
  totalMinutes: number
}

const CELL = 12
const GAP = 3
const STEP = CELL + GAP

function formatDay(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatDayLong(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

interface MonthLabel {
  left: number
  label: string
}

function monthLabels(weeks: CalendarWeek[]): MonthLabel[] {
  const labels: MonthLabel[] = []
  weeks.forEach((week, index) => {
    const first = week.days.find((day) => day !== null && Number(day.date.slice(-2)) === 1)
    if (!first) return
    labels.push({
      left: index * STEP,
      label: new Date(`${first.date}T00:00:00`).toLocaleDateString(undefined, {
        month: 'short',
      }),
    })
  })
  return labels
}

function detailFor(day: CalendarDay): string {
  if (day.minutes <= 0) return `${formatDayLong(day.date)} · no hours logged`
  const entries = day.entries === 1 ? '1 entry' : `${day.entries} entries`
  return `${formatDayLong(day.date)} · ${formatHours(day.minutes)} · ${entries}`
}

export function ContributionsCalendar({ weeks, totalMinutes }: ContributionsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = dateKey(new Date())
  const stats = streakStats(weeks)
  const selected = weeks
    .flatMap((week) => week.days)
    .find((day) => day?.date === selectedDate)

  return (
    <div className="md-card md-contrib">
      <div className="md-contrib__stats">
        <span className="md-contrib__stat">
          <span className="md-contrib__stat-value">{stats.current}</span>
          <span className="md-contrib__stat-label">current streak</span>
        </span>
        <span className="md-contrib__stat">
          <span className="md-contrib__stat-value">{stats.longest}</span>
          <span className="md-contrib__stat-label">longest streak</span>
        </span>
        <span className="md-contrib__stat">
          <span className="md-contrib__stat-value">{stats.activeDays}</span>
          <span className="md-contrib__stat-label">active days</span>
        </span>
      </div>
      <div className="md-contrib__grid">
        <div className="md-contrib__weekdays" aria-hidden="true">
          <span />
          <span>Mon</span>
          <span />
          <span>Wed</span>
          <span />
          <span>Fri</span>
          <span />
        </div>
        <div className="md-contrib__scroll">
          <div className="md-contrib__months">
            {monthLabels(weeks).map((month) => (
              <span key={month.left} style={{ left: month.left }}>
                {month.label}
              </span>
            ))}
          </div>
          <div className="md-contrib__days">
            {weeks.flatMap((week, weekIndex) =>
              week.days.map((day, dayIndex) => {
                if (!day) {
                  const voidKey = `void-${weekIndex}-${dayIndex}`
                  return <span key={voidKey} className="md-contrib__day md-contrib__day--void" />
                }
                const classes = [
                  'md-contrib__day',
                  `md-contrib__day--${day.level}`,
                  day.date === today && 'md-contrib__day--today',
                  day.date === selectedDate && 'md-contrib__day--selected',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    key={day.date}
                    type="button"
                    title={`${formatHours(day.minutes)} · ${formatDay(day.date)}`}
                    aria-label={`${formatDay(day.date)}: ${formatHours(day.minutes)}`}
                    aria-pressed={day.date === selectedDate}
                    className={classes}
                    onClick={() => setSelectedDate(day.date === selectedDate ? null : day.date)}
                  />
                )
              }),
            )}
          </div>
        </div>
      </div>
      <p className="md-contrib__detail" aria-live="polite">
        {selected ? detailFor(selected) : 'Tap a day for details'}
      </p>
      <div className="md-contrib__footer">
        <span className="md-contrib__summary">
          {formatHours(totalMinutes)} logged in the last 12 months
        </span>
        <span className="md-contrib__legend" aria-hidden="true">
          Less
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`md-contrib__day md-contrib__day--${level}`} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}
