import { useEffect, useState } from 'react'

interface SnackbarProps {
  message: string | null
  onDismiss: () => void
}

// Matches the .md-snackbar--closing animation duration.
const EXIT_MS = 150

export function Snackbar({ message, onDismiss }: SnackbarProps) {
  const [shown, setShown] = useState<string | null>(message)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  useEffect(() => {
    if (message) {
      setShown(message)
      setClosing(false)
      return
    }
    if (!shown) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(null)
      setClosing(false)
      return
    }
    setClosing(true)
    const timer = setTimeout(() => {
      setShown(null)
      setClosing(false)
    }, EXIT_MS)
    return () => clearTimeout(timer)
    // `shown` is read but intentionally not a dep: the exit timer must not restart when it flips to null.
  }, [message])

  if (!shown) return null

  return (
    <div className={`md-snackbar${closing ? ' md-snackbar--closing' : ''}`} role="status">
      {shown}
    </div>
  )
}
