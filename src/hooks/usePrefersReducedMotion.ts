import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const getInitialPreference = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }

  return window.matchMedia(QUERY).matches
}

export const usePrefersReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getInitialPreference)

  useEffect(() => {
    if (!window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
