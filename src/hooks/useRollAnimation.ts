import { useCallback, useEffect, useRef, useState } from 'react'

interface UseRollAnimationOptions<T> {
  durationMs: number
  onCommit: (result: T) => void
}

interface UseRollAnimationResult<T> {
  isRolling: boolean
  startRoll: (result: T) => void
}

export const useRollAnimation = <T>({
  durationMs,
  onCommit,
}: UseRollAnimationOptions<T>): UseRollAnimationResult<T> => {
  const [isRolling, setIsRolling] = useState(false)
  const timeoutRef = useRef<number | null>(null)
  const pendingRef = useRef<T | null>(null)

  const clearTimer = (): void => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const commitPending = useCallback((): void => {
    const pending = pendingRef.current

    if (pending === null) {
      return
    }

    pendingRef.current = null
    onCommit(pending)
  }, [onCommit])

  const startRoll = useCallback(
    (result: T): void => {
      pendingRef.current = result
      clearTimer()

      if (durationMs <= 0) {
        setIsRolling(false)
        commitPending()
        return
      }

      setIsRolling(true)
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        setIsRolling(false)
        commitPending()
      }, durationMs)
    },
    [commitPending, durationMs],
  )

  useEffect(
    () => () => {
      clearTimer()
    },
    [],
  )

  return {
    isRolling,
    startRoll,
  }
}
