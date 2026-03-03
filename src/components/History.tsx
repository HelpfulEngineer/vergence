import { formatPool } from '../dice/pool'
import type { DicePool } from '../dice/types'

export interface HistoryEntry {
  id: number
  pool: DicePool
  outcome: string
  timestamp: number
}

interface HistoryProps {
  items: HistoryEntry[]
}

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
            <p>{formatPool(item.pool)}</p>
          </li>
        ))}
      </ul>
    )}
  </section>
)
