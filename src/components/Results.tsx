import type { ResolvedRoll } from '../dice/resolver'
import type { SymbolCode } from '../dice/types'

interface ResultsProps {
  symbols: SymbolCode[]
  resolved: ResolvedRoll | null
  rolledAt: number | null
}

const SYMBOL_LABELS: Record<SymbolCode, string> = {
  S: 'S',
  F: 'F',
  A: 'A',
  T: 'T',
  TRI: 'Tri',
  DES: 'Des',
  L: 'L',
  D: 'D',
}

const netClass = (value: number): string => {
  if (value > 0) return 'value-positive'
  if (value < 0) return 'value-negative'
  return 'value-neutral'
}

const formatNet = (value: number): string => (value > 0 ? `+${value}` : `${value}`)

export const Results = ({ symbols, resolved, rolledAt }: ResultsProps) => (
  <section className="panel" aria-label="Roll results">
    <header className="panel-header">
      <h2>Results</h2>
      <p>{rolledAt ? new Date(rolledAt).toLocaleTimeString() : 'Waiting for first roll'}</p>
    </header>

    {!resolved ? (
      <p className="empty-copy">Roll a pool to see symbols and net results.</p>
    ) : (
      <>
        <p className="outcome-line">{resolved.outcome}</p>

        <div className="chip-wrap">
          {symbols.length > 0 ? (
            symbols.map((symbol, index) => (
              <span key={`${symbol}-${index}`} className={`symbol-chip symbol-${symbol.toLowerCase()}`}>
                {SYMBOL_LABELS[symbol]}
              </span>
            ))
          ) : (
            <span className="empty-chip">No symbols rolled</span>
          )}
        </div>

        <dl className="tally-grid">
          <dt>Net Successes</dt>
          <dd className={netClass(resolved.netSuccess)}>{formatNet(resolved.netSuccess)}</dd>

          <dt>Net Advantages</dt>
          <dd className={netClass(resolved.netAdvantage)}>{formatNet(resolved.netAdvantage)}</dd>

          <dt>Triumph Count</dt>
          <dd>{resolved.totals.triumph}</dd>

          <dt>Despair Count</dt>
          <dd>{resolved.totals.despair}</dd>

          <dt>Light Pips</dt>
          <dd>{resolved.totals.light}</dd>

          <dt>Dark Pips</dt>
          <dd>{resolved.totals.dark}</dd>
        </dl>
      </>
    )}
  </section>
)
