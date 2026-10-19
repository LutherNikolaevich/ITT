import { useEffect, useState, type ReactNode } from 'react'
import { IconButton } from './IconButton'

interface DialogProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
  wide?: boolean
  className?: string
  /** Unmount synchronously on close — set when a view transition animates the exit. */
  instant?: boolean
}

// Matches the .md-dialog--closing / .md-dialog-scrim--closing animation duration.
const EXIT_MS = 150

export function Dialog({ open, title, onClose, children, actions, wide, className, instant }: DialogProps) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMounted(false)
      setClosing(false)
      return
    }
    setClosing(true)
    const timer = setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, EXIT_MS)
    return () => clearTimeout(timer)
  }, [open, instant])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div
      className={`md-dialog-scrim${closing ? ' md-dialog-scrim--closing' : ''}`}
      onClick={onClose}
    >
      <div
        className={`md-dialog${closing ? ' md-dialog--closing' : ''}${wide ? ' md-dialog--wide' : ''}${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="md-dialog__header">
          <h2 className="md-dialog__title">{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </div>
        <div className="md-dialog__body">{children}</div>
        {actions && <div className="md-dialog__actions">{actions}</div>}
      </div>
    </div>
  )
}
