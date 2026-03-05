import { useEffect, useState } from 'react'

export const SymbolKey = () => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [open])

  return (
    <div className="symbol-key">
      <button
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
        <section className="symbol-key-popover" role="dialog" aria-label="Symbol key">
          <header className="symbol-key-header">
            <h3>Symbol Key</h3>
            <button
              type="button"
              className="ghost-button symbol-key-close"
              aria-label="Close symbol key"
              onClick={() => setOpen(false)}
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
