import { useCallback, useMemo, useRef, useState } from 'react'
import './App.css'
import { History } from './components/History'
import type { HistoryEntry } from './components/History'
import { OddsIntelPanel } from './components/OddsIntelPanel'
import { PoolBuilder } from './components/PoolBuilder'
import { Results } from './components/Results'
import {
  adjustDieCount,
  createEmptyPool,
  downgradeChallengeToDifficulty,
  downgradeProficiencyToAbility,
  formatPool,
  totalDiceInPool,
  upgradeAbilityToProficiency,
  upgradeDifficultyToChallenge,
} from './dice/pool'
import { resolveSymbols } from './dice/resolver'
import { rollPool } from './dice/roller'
import type { DicePool, DieRoll, DieType, SymbolCode } from './dice/types'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { useRollAnimation } from './hooks/useRollAnimation'
import { useRollingPreview } from './hooks/useRollingPreview'

const ROLL_ANIMATION_MS = 420

interface RollState {
  symbols: SymbolCode[]
  rolls: DieRoll[]
  resolved: ReturnType<typeof resolveSymbols>
  rolledAt: number
  poolSnapshot: DicePool
  poolSummary: string
}

function App() {
  const [pool, setPool] = useState<DicePool>(() => createEmptyPool())
  const [lastRoll, setLastRoll] = useState<RollState | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [oddsEnabled, setOddsEnabled] = useState(false)
  const historyId = useRef(1)
  const prefersReducedMotion = usePrefersReducedMotion()
  const canRoll = useMemo(() => totalDiceInPool(pool) > 0, [pool])

  const commitRoll = useCallback((roll: RollState): void => {
    setLastRoll(roll)
    setHistory((previousHistory) => {
      const nextEntry: HistoryEntry = {
        id: historyId.current,
        pool: { ...roll.poolSnapshot },
        outcome: roll.resolved.outcome,
        timestamp: roll.rolledAt,
        symbols: [...roll.symbols],
        netSuccess: roll.resolved.netSuccess,
        netAdvantage: roll.resolved.netAdvantage,
        triumph: roll.resolved.totals.triumph,
        despair: roll.resolved.totals.despair,
        light: roll.resolved.totals.light,
        dark: roll.resolved.totals.dark,
      }

      historyId.current += 1
      return [nextEntry, ...previousHistory].slice(0, 10)
    })
  }, [])

  const { isRolling, startRoll } = useRollAnimation<RollState>({
    durationMs: prefersReducedMotion ? 0 : ROLL_ANIMATION_MS,
    onCommit: commitRoll,
  })

  const previewChipCount = useMemo(() => {
    if (lastRoll) {
      return Math.max(lastRoll.symbols.length, 6)
    }

    return Math.max(totalDiceInPool(pool), 6)
  }, [lastRoll, pool])

  const rollingPreview = useRollingPreview({
    isRolling,
    chipCount: previewChipCount,
    reducedMotion: prefersReducedMotion,
  })

  const outcomeFlags = useMemo(() => {
    if (!lastRoll) {
      return null
    }

    return {
      isSuccess: lastRoll.resolved.netSuccess >= 1,
      hasTriumph: lastRoll.resolved.totals.triumph > 0,
      hasDespair: lastRoll.resolved.totals.despair > 0,
    }
  }, [lastRoll])

  const updateDie = (die: DieType, delta: number): void => {
    setPool((previousPool) => adjustDieCount(previousPool, die, delta))
  }

  const handleRoll = (): void => {
    if (!canRoll || isRolling) {
      return
    }

    const poolSnapshot: DicePool = { ...pool }
    const { symbols, rolls } = rollPool(poolSnapshot)
    const resolved = resolveSymbols(symbols)
    const rolledAt = Date.now()

    startRoll({
      symbols,
      rolls,
      resolved,
      rolledAt,
      poolSnapshot,
      poolSummary: formatPool(poolSnapshot),
    })
  }

  const resultModel = useMemo(() => {
    if (!lastRoll) {
      return null
    }

    return {
      symbols: lastRoll.symbols,
      rolls: lastRoll.rolls,
      resolved: lastRoll.resolved,
      rolledAt: lastRoll.rolledAt,
      poolSummary: lastRoll.poolSummary,
    }
  }, [lastRoll])

  const rollingPoolSummary = useMemo(() => {
    if (!isRolling) {
      return null
    }

    return formatPool(pool)
  }, [isRolling, pool])

  return (
    <main className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Star Wars RPG Dice Console</p>
        <h1>Vergence</h1>
        <p className="app-subtitle">
          Build your pool, apply upgrades, and resolve symbols with exact FFG / Edge Studio rules.
        </p>
      </header>

      <div className="layout-grid">
        <PoolBuilder
          pool={pool}
          canRoll={canRoll}
          isRolling={isRolling}
          oddsEnabled={oddsEnabled}
          onIncrement={(die) => updateDie(die, 1)}
          onDecrement={(die) => updateDie(die, -1)}
          onToggleOdds={() => setOddsEnabled((enabled) => !enabled)}
          onUpgradeAbility={() => setPool((previousPool) => upgradeAbilityToProficiency(previousPool))}
          onDowngradeProficiency={() =>
            setPool((previousPool) => downgradeProficiencyToAbility(previousPool))
          }
          onUpgradeDifficulty={() =>
            setPool((previousPool) => upgradeDifficultyToChallenge(previousPool))
          }
          onDowngradeChallenge={() =>
            setPool((previousPool) => downgradeChallengeToDifficulty(previousPool))
          }
          onQuickBoost={() => updateDie('boost', 1)}
          onQuickSetback={() => updateDie('setback', 1)}
          onClear={() => setPool(createEmptyPool())}
          onRoll={handleRoll}
        />

        <div className="right-column">
          {oddsEnabled ? <OddsIntelPanel pool={pool} /> : null}
          <Results
            result={resultModel}
            isRolling={isRolling}
            rollingPreview={rollingPreview}
            outcomeFlags={outcomeFlags}
            rollingPoolSummary={rollingPoolSummary}
          />
          <History items={history} />
        </div>
      </div>
    </main>
  )
}

export default App
