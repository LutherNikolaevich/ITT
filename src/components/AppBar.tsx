import { useEffect, useState } from 'react'

interface AppBarProps {
  title: string
}

export function AppBar({ title }: AppBarProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`md-appbar${scrolled ? ' md-appbar--scrolled' : ''}`}>
      <h1 className="md-appbar__title">{title}</h1>
    </header>
  )
}
