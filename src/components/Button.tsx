import type { ReactNode } from 'react'
import { Icon } from './Icon'

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  icon?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  className?: string
}

export function Button({
  children,
  onClick,
  variant = 'filled',
  icon,
  type = 'button',
  disabled,
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`md-btn md-btn--${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} className="md-btn__icon" />}
      <span>{children}</span>
    </button>
  )
}
