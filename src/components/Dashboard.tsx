import type { Settings, TimeEntry } from '../types'
import { formatHours } from '../lib/time'
import { fillSummary, thisMonthMinutes, thisWeekMinutes } from '../lib/aggregate'
import { contributionsCalendar } from '../lib/contributions'
import { Button } from './Button'
import { Chip } from './Chip'
import { ContributionsCalendar } from './ContributionsCalendar'
import { Icon } from './Icon'
import { ProgressIndicator } from './ProgressIndicator'
import { StatCard } from './StatCard'

interface DashboardProps {
  entries: TimeEntry[]
  settings: Settings
  filledHolidays: string[]
  onToggleHolidayFill: (date: string) => void
  filledUndertime: string[]
  onToggleUndertimeFill: (date: string) => void
  filledAbsences: string[]
  onToggleAbsenceFill: (date: string) => void
  onSetUp: () => void
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function FillRow({
  date,
  tag,
  sub,
  selected,
  onToggle,
}: {
  date: string
  tag?: string
  sub: string
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`md-holiday-row${selected ? ' md-holiday-row--selected' : ''}`}
      onClick={onToggle}
    >
      <span className="md-holiday-row__header">
        <span className="md-holiday-row__title">
          <span className="md-holiday-row__date">{formatDate(date)}</span>
          {tag && <Chip>{tag}</Chip>}
        </span>
        {selected && <Icon name="check_circle" filled />}
      </span>
      <span className="md-holiday-row__sub">{sub}</span>
    </button>
  )
}

export function Dashboard({
  entries,
  settings,
  filledHolidays,
  onToggleHolidayFill,
  filledUndertime,
  onToggleUndertimeFill,
  filledAbsences,
  onToggleAbsenceFill,
  onSetUp,
}: DashboardProps) {
  const summary = fillSummary(entries, settings, filledHolidays, filledUndertime, filledAbsences)
  const total = summary.completedMinutes
  const required = settings.requiredHours * 60
  const remaining = Math.max(0, required - total)
  const pct = required > 0 ? Math.round((total / required) * 100) : 0
  const week = thisWeekMinutes(entries)
  const month = thisMonthMinutes(entries)
  const holidayRequired = summary.holidays.reduce((sum, h) => sum + h.requiredMinutes, 0)
  const holidayFilled = summary.holidays.reduce((sum, h) => sum + h.filledMinutes, 0)
  const holidayPct = holidayRequired > 0 ? Math.round((holidayFilled / holidayRequired) * 100) : 0
  const undertimeRequired = summary.undertime.reduce((sum, d) => sum + d.requiredMinutes, 0)
  const undertimeFilled = summary.undertime.reduce((sum, d) => sum + d.filledMinutes, 0)
  const absenceRequired = summary.absences.reduce((sum, d) => sum + d.requiredMinutes, 0)
  const absenceFilled = summary.absences.reduce((sum, d) => sum + d.filledMinutes, 0)
  const fillDays = [...summary.undertime, ...summary.absences].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )
  const fillRequired = undertimeRequired + absenceRequired
  const fillFilled = undertimeFilled + absenceFilled
  const fillPct = fillRequired > 0 ? Math.round((fillFilled / fillRequired) * 100) : 0
  const calendarWeeks = contributionsCalendar(
    entries,
    (settings.defaultDailyHours ?? 0) * 60,
    settings.startDate,
    [...summary.holidays, ...summary.undertime, ...summary.absences],
  )

  return (
    <div className="md-page">
      <div className="md-page__header">
        <h2 className="md-headline">Progress</h2>
        <span className="md-page__sub">
          {settings.requiredHours > 0
            ? 'Keep logging daily hours to reach your goal'
            : ' '}
        </span>
      </div>

      {settings.requiredHours <= 0 ? (
        <div className="md-empty">
          <h3 className="md-empty__title">Set up your OJT requirements</h3>
          <p className="md-empty__body">
            Enter your required hours and daily schedule to start tracking.
          </p>
          <Button variant="filled" icon="add" onClick={onSetUp}>
            Add requirements
          </Button>
        </div>
      ) : (
        <>
          <div className="md-grid">
            <StatCard hero label="Total completed" value={formatHours(total)} icon="task_alt" />

            <div className="md-card md-progress-card">
            <div className="md-progress-card__header">
              <span className="md-progress-card__label">Overall progress</span>
              <span className="md-progress-card__pct">{pct}%</span>
            </div>
            <ProgressIndicator value={pct} />
            <p className="md-progress-card__body">
              {remaining === 0
                ? `Requirement met${total > required ? ` — ${formatHours(total - required)} over` : ''}.`
                : `${formatHours(remaining)} to go.`}
            </p>

            {summary.holidays.length > 0 && (
              <div className="md-progress-card__section">
                <div className="md-progress-card__header">
                  <span className="md-progress-card__label">Holidays filled</span>
                  <span className="md-progress-card__pct">{holidayPct}%</span>
                </div>
                <ProgressIndicator value={holidayPct} />
                <div className="md-holiday-list">
                  {summary.holidays.map((holiday) => (
                    <FillRow
                      key={holiday.date}
                      date={holiday.date}
                      selected={filledHolidays.includes(holiday.date)}
                      onToggle={() => onToggleHolidayFill(holiday.date)}
                      sub={
                        holiday.filledMinutes > 0
                          ? `${formatHours(holiday.filledMinutes)} of ${formatHours(holiday.requiredMinutes)}`
                          : 'Not filled'
                      }
                    />
                  ))}
                </div>
                <p className="md-progress-card__body">
                  {summary.filledCount} of {summary.holidays.length} holidays filled
                </p>
              </div>
            )}

            {fillDays.length > 0 && (
              <div className="md-progress-card__section">
                <div className="md-progress-card__header">
                  <span className="md-progress-card__label">Undertime &amp; absences filled</span>
                  <span className="md-progress-card__pct">{fillPct}%</span>
                </div>
                <ProgressIndicator value={fillPct} />
                <div className="md-holiday-list">
                  {fillDays.map((day) => (
                    <FillRow
                      key={day.date}
                      date={day.date}
                      tag={day.kind === 'undertime' ? 'Undertime' : 'Absent'}
                      selected={
                        day.kind === 'undertime'
                          ? filledUndertime.includes(day.date)
                          : filledAbsences.includes(day.date)
                      }
                      onToggle={() =>
                        day.kind === 'undertime'
                          ? onToggleUndertimeFill(day.date)
                          : onToggleAbsenceFill(day.date)
                      }
                      sub={
                        day.filledMinutes > 0
                          ? `${formatHours(day.filledMinutes)} of ${formatHours(day.requiredMinutes)}`
                          : day.kind === 'undertime'
                            ? `${formatHours(day.requiredMinutes)} short`
                            : 'Not filled'
                      }
                    />
                  ))}
                </div>
                <p className="md-progress-card__body">
                  {summary.filledUndertimeCount + summary.filledAbsenceCount} of {fillDays.length}{' '}
                  days filled
                </p>
              </div>
            )}
          </div>

          <StatCard label="Required" value={formatHours(required)} icon="flag" />
          <StatCard label="This week" value={formatHours(week)} icon="today" />
          <StatCard label="This month" value={formatHours(month)} icon="calendar_month" />
          <StatCard
            label="Remaining excess"
            value={formatHours(summary.remainingExcessMinutes)}
            icon="trending_up"
          />

          <ContributionsCalendar weeks={calendarWeeks} entries={entries} />
          </div>
        </>
      )}
    </div>
  )
}
