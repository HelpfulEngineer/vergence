import { formatPool } from '../dice/pool'
import type { DicePool, SymbolCode } from '../dice/types'

export interface HistoryEntry {
  id: number
  pool: DicePool
  outcome: string
  timestamp: number
  symbols: SymbolCode[]
  netSuccess: number
  netAdvantage: number
  triumph: number
  despair: number
  light: number
  dark: number
}

interface HistoryProps {
  items: HistoryEntry[]
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

const formatNet = (value: number): string => (value > 0 ? `+${value}` : `${value}`)

const formatTimestamp = (timestamp: number): string =>
  new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

export const History = ({ items }: HistoryProps) => (
  <section className="panel" aria-label="Roll history">
    <header className="panel-header">
      <h2>History</h2>
      <p>Last {Math.min(items.length, 10)} rolls</p>
    </header>

    {items.length === 0 ? (
      <p className="empty-copy">No rolls yet.</p>
    ) : (
      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id} className="history-item">
            <div className="history-meta">
              <strong>{item.outcome}</strong>
              <time dateTime={new Date(item.timestamp).toISOString()}>{formatTimestamp(item.timestamp)}</time>
            </div>
            <p className="history-pool">{formatPool(item.pool)}</p>
            <div className="history-symbols">
              {item.symbols.length > 0 ? (
                item.symbols.map((symbol, index) => (
                  <span key={`${item.id}-${symbol}-${index}`} className={`symbol-chip symbol-${symbol.toLowerCase()}`}>
                    {SYMBOL_LABELS[symbol]}
                  </span>
                ))
              ) : (
                <span className="empty-chip">No symbols rolled</span>
              )}
            </div>
            <p className="history-breakdown">
              Net S {formatNet(item.netSuccess)} | Net A {formatNet(item.netAdvantage)} | Tri {item.triumph} | Des{' '}
              {item.despair} | L {item.light} | D {item.dark}
            </p>
          </li>
        ))}
      </ul>
    )}
  </section>
)
