import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import './App.css'
import { History } from './components/History'
import type { HistoryEntry } from './components/History'
import { OddsIntelPanel } from './components/OddsIntelPanel'
import { OracleDie } from './components/OracleDie'
import { PoolBuilder } from './components/PoolBuilder'
import { Results } from './components/Results'
import { rollOracleDie, type OracleFace } from './dice/oracle'
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
const ORACLE_LONG_PRESS_MS = 650

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
  const [oracleOpen, setOracleOpen] = useState(false)
  const [oracleResult, setOracleResult] = useState<OracleFace | null>(null)
  const historyId = useRef(1)
  const oracleTriggerRef = useRef<HTMLButtonElement | null>(null)
  const oracleLongPressTimerRef = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const canRoll = useMemo(() => totalDiceInPool(pool) > 0, [pool])

  const clearOracleLongPress = useCallback((): void => {
    if (oracleLongPressTimerRef.current === null) {
      return
    }

    window.clearTimeout(oracleLongPressTimerRef.current)
    oracleLongPressTimerRef.current = null
  }, [])

  useEffect(() => clearOracleLongPress, [clearOracleLongPress])

  const handleOracleRoll = useCallback((): void => {
    setOracleResult(rollOracleDie())
  }, [])

  const openOracle = useCallback((): void => {
    clearOracleLongPress()
    setOracleResult(rollOracleDie())
    setOracleOpen(true)
  }, [clearOracleLongPress])

  const closeOracle = useCallback((): void => {
    clearOracleLongPress()
    setOracleOpen(false)
    window.setTimeout(() => {
      oracleTriggerRef.current?.focus()
    }, 0)
  }, [clearOracleLongPress])

  const handleTitlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>): void => {
      if (event.pointerType === 'mouse') {
        return
      }

      clearOracleLongPress()
      oracleLongPressTimerRef.current = window.setTimeout(() => {
        oracleLongPressTimerRef.current = null
        openOracle()
      }, ORACLE_LONG_PRESS_MS)
    },
    [clearOracleLongPress, openOracle],
  )

  const handleTitleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openOracle()
      }
    },
    [openOracle],
  )

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
        <button
          ref={oracleTriggerRef}
          aria-label="Vergence"
          className="app-title-button"
          type="button"
          onDoubleClick={openOracle}
          onKeyDown={handleTitleKeyDown}
          onPointerCancel={clearOracleLongPress}
          onPointerDown={handleTitlePointerDown}
          onPointerLeave={clearOracleLongPress}
          onPointerUp={clearOracleLongPress}
        >
          <span className="app-title-text">Vergence</span>
        </button>
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

      <OracleDie
        isOpen={oracleOpen}
        result={oracleResult}
        onClose={closeOracle}
        onRoll={handleOracleRoll}
      />
    </main>
  )
}

export default App
