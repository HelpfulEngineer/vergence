import type { DicePool } from '../dice/types'
import { computeOdds, makeOddsCacheKey } from '../odds/odds'

interface OddsIntelPanelProps {
  pool: DicePool
}

const formatPercent = (value: number): string => `${(value * 100).toFixed(1)}%`
const formatMean = (value: number): string => value.toFixed(2)

export const OddsIntelPanel = ({ pool }: OddsIntelPanelProps) => {
  const odds = computeOdds(pool)

  return (
    <section className="panel intel-panel" aria-label="Odds and intelligence">
      <header className="intel-header">
        <div>
          <p className="intel-kicker">CLASSIFIED INTEL // ODDS ESTIMATE</p>
          <h2>ODDS / INTEL</h2>
        </div>
        <div className="intel-badges">
          <span className="intel-lock">LOCKED</span>
          <span className="intel-classified">CLASSIFIED</span>
        </div>
      </header>

      <p className="intel-pool">POOL KEY: {makeOddsCacheKey(pool)}</p>

      <dl className="intel-grid">
        <dt>Chance of Success</dt>
        <dd>{formatPercent(odds.pSuccess)}</dd>

        <dt>Chance of Failure</dt>
        <dd>{formatPercent(odds.pFailure)}</dd>

        <dt>Expected Net Success</dt>
        <dd>{formatMean(odds.expectedNetSuccess)}</dd>
      </dl>

      <p className="intel-footnote">Never tell me the odds.</p>
    </section>
  )
}
