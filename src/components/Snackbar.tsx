import { useEffect } from 'react'

interface SnackbarProps {
  message: string | null
  onDismiss: () => void
}

export function Snackbar({ message, onDismiss }: SnackbarProps) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="md-snackbar" role="status">
      {message}
    </div>
  )
}
