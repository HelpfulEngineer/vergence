import { useMemo, useRef, useState } from 'react'
import './App.css'
import { History } from './components/History'
import type { HistoryEntry } from './components/History'
import { PoolBuilder } from './components/PoolBuilder'
import { Results } from './components/Results'
import {
  adjustDieCount,
  createEmptyPool,
  downgradeChallengeToDifficulty,
  downgradeProficiencyToAbility,
  totalDiceInPool,
  upgradeAbilityToProficiency,
  upgradeDifficultyToChallenge,
} from './dice/pool'
import { resolveSymbols } from './dice/resolver'
import { rollPool } from './dice/roller'
import type { DicePool, DieType, SymbolCode } from './dice/types'

interface LastRollState {
  symbols: SymbolCode[]
  resolved: ReturnType<typeof resolveSymbols>
  rolledAt: number
}

function App() {
  const [pool, setPool] = useState<DicePool>(() => createEmptyPool())
  const [lastRoll, setLastRoll] = useState<LastRollState | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const historyId = useRef(1)
  const canRoll = useMemo(() => totalDiceInPool(pool) > 0, [pool])

  const updateDie = (die: DieType, delta: number): void => {
    setPool((previousPool) => adjustDieCount(previousPool, die, delta))
  }

  const handleRoll = (): void => {
    if (!canRoll) {
      return
    }

    const { symbols } = rollPool(pool)
    const resolved = resolveSymbols(symbols)
    const rolledAt = Date.now()

    setLastRoll({ symbols, resolved, rolledAt })
    setHistory((previousHistory) => {
      const nextEntry: HistoryEntry = {
        id: historyId.current,
        pool: { ...pool },
        outcome: resolved.outcome,
        timestamp: rolledAt,
      }

      historyId.current += 1
      return [nextEntry, ...previousHistory].slice(0, 10)
    })
  }

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
          onIncrement={(die) => updateDie(die, 1)}
          onDecrement={(die) => updateDie(die, -1)}
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
          <Results
            symbols={lastRoll?.symbols ?? []}
            resolved={lastRoll?.resolved ?? null}
            rolledAt={lastRoll?.rolledAt ?? null}
          />
          <History items={history} />
        </div>
      </div>
    </main>
  )
}

export default App
