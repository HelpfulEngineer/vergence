import { useEffect, useMemo, useState } from 'react'

interface UseRollingPreviewOptions {
  isRolling: boolean
  chipCount: number
  reducedMotion: boolean
}

const PREVIEW_TOKENS = ['S', 'F', 'A', 'T', 'TRI', 'DES', 'L', 'D', 'S A', 'F T', '-']

const randomToken = (): string => PREVIEW_TOKENS[Math.floor(Math.random() * PREVIEW_TOKENS.length)]

const makePreview = (count: number): string[] =>
  Array.from({ length: count }, () => randomToken())

export const useRollingPreview = ({
  isRolling,
  chipCount,
  reducedMotion,
}: UseRollingPreviewOptions): string[] => {
  const safeCount = useMemo(() => Math.max(4, Math.min(12, chipCount)), [chipCount])
  const [preview, setPreview] = useState<string[]>([])

  useEffect(() => {
    if (!isRolling || reducedMotion) {
      return
    }

    const updatePreview = (): void => {
      setPreview(makePreview(safeCount))
    }

    const interval = window.setInterval(() => {
      updatePreview()
    }, 90)

    return () => window.clearInterval(interval)
  }, [isRolling, reducedMotion, safeCount])

  return preview
}
