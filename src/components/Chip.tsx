import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface ChipProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  icon?: string
  title?: string
}

export function Chip({ children, onClick, selected, icon, title }: ChipProps) {
  if (onClick) {
    return (
      <button
        type="button"
        className={`md-chip md-chip--button${selected ? ' md-chip--selected' : ''}`}
        onClick={onClick}
        title={title}
        aria-pressed={selected}
      >
        {icon && <Icon name={icon} />}
        {children}
      </button>
    )
  }
  return (
    <span className={`md-chip${selected ? ' md-chip--selected' : ''}`}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  )
}
