import { useState } from 'react'
import type { CalendarDay, CalendarWeek } from '../lib/contributions'
import { dateKey } from '../lib/aggregate'
import { formatHours } from '../lib/time'
import type { TimeEntry } from '../types'
import { EntryCard } from './EntryCard'

interface ContributionsCalendarProps {
  weeks: CalendarWeek[]
  entries: TimeEntry[]
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
  if (day.entries === 0 && day.filled > 0) {
    return `${formatDayLong(day.date)} · ${formatHours(day.minutes)} filled`
  }
  const entries = day.entries === 1 ? '1 entry' : `${day.entries} entries`
  const filled = day.filled > 0 ? ` · ${formatHours(day.filled)} filled` : ''
  return `${formatDayLong(day.date)} · ${formatHours(day.minutes)} · ${entries}${filled}`
}

export function ContributionsCalendar({ weeks, entries }: ContributionsCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = dateKey(new Date())
  const selected = weeks
    .flatMap((week) => week.days)
    .find((day) => day?.date === selectedDate)
  const dayEntries = selectedDate
    ? entries
        .filter((entry) => entry.date === selectedDate)
        .sort((a, b) => a.timeIn.localeCompare(b.timeIn))
    : []

  return (
    <div className="md-card md-contrib">
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
      {selected && dayEntries.length > 0 ? (
        <ul className="md-entry-list md-contrib__entries">
          {dayEntries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </ul>
      ) : (
        <p className="md-contrib__detail" aria-live="polite">
          {selected ? detailFor(selected) : 'Tap a day for details'}
        </p>
      )}
      <div className="md-contrib__footer">
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
