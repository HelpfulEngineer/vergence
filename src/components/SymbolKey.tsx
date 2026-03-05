import { useCallback, useEffect, useRef, useState } from 'react'

export const SymbolKey = () => {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLElement | null>(null)

  const closeKey = useCallback((restoreFocus: boolean): void => {
    setOpen(false)

    if (restoreFocus) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus()
      })
    }
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeKey(true)
      }
    }

    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }

      closeKey(false)
    }

    window.addEventListener('keydown', onEscape)
    window.addEventListener('pointerdown', onPointerDown)

    return () => {
      window.removeEventListener('keydown', onEscape)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [closeKey, open])

  return (
    <div className="symbol-key">
      <button
        ref={triggerRef}
        type="button"
        className="ghost-button symbol-key-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Symbol key"
        onClick={() => setOpen((previous) => !previous)}
      >
        ? Key
      </button>

      {open ? (
        <section
          ref={popoverRef}
          className="symbol-key-popover"
          role="dialog"
          aria-modal="false"
          aria-label="Symbol key"
        >
          <header className="symbol-key-header">
            <h3>Symbol Key</h3>
            <button
              type="button"
              className="ghost-button symbol-key-close"
              aria-label="Close symbol key"
              onClick={() => closeKey(true)}
            >
              Close
            </button>
          </header>

          <dl className="symbol-key-list">
            <dt>S</dt>
            <dd>Success</dd>
            <dt>F</dt>
            <dd>Failure</dd>
            <dt>A</dt>
            <dd>Advantage</dd>
            <dt>T</dt>
            <dd>Threat</dd>
            <dt>TRI</dt>
            <dd>Triumph (counts as 1 Success + special trigger)</dd>
            <dt>DES</dt>
            <dd>Despair (counts as 1 Failure + special trigger)</dd>
            <dt>L</dt>
            <dd>Light Force pip</dd>
            <dt>D</dt>
            <dd>Dark Force pip</dd>
          </dl>

          <p className="symbol-key-note">
            Success cancels Failure; Advantage cancels Threat. Triumph and Despair still count as
            special triggers.
          </p>
        </section>
      ) : null}
    </div>
  )
}
