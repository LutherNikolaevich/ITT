import type { View } from '../types'
import { NAV_ITEMS } from './NavigationRail'
import { Icon } from './Icon'

interface BottomNavProps {
  view: View
  onChange: (view: View) => void
}

export function BottomNav({ view, onChange }: BottomNavProps) {
  return (
    <nav className="md-bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`md-bottom-nav__item${view === item.id ? ' md-bottom-nav__item--active' : ''}`}
          aria-current={view === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          <span className="md-bottom-nav__indicator" aria-hidden="true">
            <Icon name={item.icon} filled={view === item.id} />
          </span>
          <span className="md-bottom-nav__label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
