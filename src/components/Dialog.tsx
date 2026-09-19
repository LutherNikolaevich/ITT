import { useEffect, type ReactNode } from 'react'
import { Icon } from './Icon'

interface DialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
  wide?: boolean
  className?: string
}

export function Dialog({ open, title, onClose, children, actions, wide, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="md-dialog-scrim" onClick={onClose}>
      <div
        className={`md-dialog${wide ? ' md-dialog--wide' : ''}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md-dialog__header">
          <h2 className="md-dialog__title">{title}</h2>
          <button
            type="button"
            className="md-icon-btn"
            aria-label="Close"
            title="Close"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="md-dialog__body">{children}</div>
        {actions && <div className="md-dialog__actions">{actions}</div>}
      </div>
    </div>
  )
}
