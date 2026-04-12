import { useEffect, useRef } from 'react'
import type { OracleFace } from '../dice/oracle'

interface OracleDieProps {
  isOpen: boolean
  result: OracleFace | null
  onRoll: () => void
  onClose: () => void
}

const RESULT_COPY: Record<OracleFace, string> = {
  YES: 'Proceed.',
  NO: 'Stand down.',
  MAYBE: 'Clouded. Ask again.',
}

export function OracleDie({ isOpen, result, onRoll, onClose }: OracleDieProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const resultToneClass = result ? `oracle-result-${result.toLowerCase()}` : ''

  return (
    <div className="oracle-overlay" onClick={onClose}>
      <div
        aria-labelledby="oracle-die-title"
        aria-modal="true"
        className="oracle-panel"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="oracle-header">
          <div>
            <p className="oracle-kicker">Hidden Protocol // Oracle Die</p>
            <h2 id="oracle-die-title">Ask The Oracle</h2>
          </div>
          <button
            ref={closeButtonRef}
            aria-label="Close Oracle Die"
            className="ghost-button oracle-close-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="oracle-copy">A six-sided answer engine: 2 YES, 2 NO, 2 MAYBE.</p>

        <div
          aria-live="polite"
          className={`oracle-result ${resultToneClass}`.trim()}
        >
          <span className="oracle-result-label">{result ?? '...'}</span>
          <span className="oracle-result-copy">{result ? RESULT_COPY[result] : 'Awaiting query.'}</span>
        </div>

        <div className="oracle-actions">
          <button className="roll-button oracle-roll-button" type="button" onClick={onRoll}>
            {result ? 'Ask Again' : 'Ask the Oracle'}
          </button>
        </div>
      </div>
    </div>
  )
}
