import type { View } from '../types'
import { Icon } from './Icon'

interface RailItem {
  id: View
  icon: string
  label: string
}

const PRIMARY_ITEMS: RailItem[] = [
  { id: 'dashboard', icon: 'space_dashboard', label: 'Dashboard' },
  { id: 'timesheet', icon: 'list_alt', label: 'Timesheet' },
]

const SECONDARY_ITEMS: RailItem[] = [{ id: 'settings', icon: 'settings', label: 'Settings' }]

export const NAV_ITEMS: RailItem[] = [...PRIMARY_ITEMS, ...SECONDARY_ITEMS]

interface NavigationRailProps {
  view: View
  onChange: (view: View) => void
}

export function NavigationRail({ view, onChange }: NavigationRailProps) {
  const renderItem = (item: RailItem) => (
    <button
      key={item.id}
      type="button"
      className={`md-rail__item${view === item.id ? ' md-rail__item--active' : ''}`}
      aria-current={view === item.id ? 'page' : undefined}
      onClick={() => onChange(item.id)}
    >
      <span className="md-rail__indicator" aria-hidden="true">
        <Icon name={item.icon} filled={view === item.id} />
      </span>
      <span className="md-rail__label">{item.label}</span>
    </button>
  )

  return (
    <nav className="md-rail" aria-label="Main navigation">
      <div className="md-rail__brand" role="img" aria-label="OJT Tracker">
        <Icon name="timelapse" />
      </div>
      <div className="md-rail__group">{PRIMARY_ITEMS.map(renderItem)}</div>
      <div className="md-rail__group md-rail__group--secondary">
        {SECONDARY_ITEMS.map(renderItem)}
      </div>
    </nav>
  )
}
