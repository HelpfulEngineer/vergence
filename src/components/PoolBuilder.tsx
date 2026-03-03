import type { CSSProperties } from 'react'
import { DICE, DIE_ORDER } from '../dice/diceTables'
import type { DicePool, DieType } from '../dice/types'

interface PoolBuilderProps {
  pool: DicePool
  canRoll: boolean
  onIncrement: (die: DieType) => void
  onDecrement: (die: DieType) => void
  onUpgradeAbility: () => void
  onDowngradeProficiency: () => void
  onUpgradeDifficulty: () => void
  onDowngradeChallenge: () => void
  onQuickBoost: () => void
  onQuickSetback: () => void
  onClear: () => void
  onRoll: () => void
}

export const PoolBuilder = ({
  pool,
  canRoll,
  onIncrement,
  onDecrement,
  onUpgradeAbility,
  onDowngradeProficiency,
  onUpgradeDifficulty,
  onDowngradeChallenge,
  onQuickBoost,
  onQuickSetback,
  onClear,
  onRoll,
}: PoolBuilderProps) => (
  <section className="panel" aria-label="Dice pool builder">
    <header className="panel-header">
      <h2>Dice Pool</h2>
      <p>Build your check, then roll.</p>
    </header>

    <ul className="dice-list">
      {DIE_ORDER.map((die) => {
        const definition = DICE[die]
        const count = pool[die]

        return (
          <li key={die} className="die-row">
            <div
              className="die-label"
              style={{ '--die-color': definition.color } as CSSProperties}
            >
              <span className="die-short">{definition.shortLabel}</span>
              <span className="die-name">{definition.label}</span>
            </div>

            <div className="die-controls">
              <button
                type="button"
                className="circle-button"
                onClick={() => onDecrement(die)}
                disabled={count === 0}
                aria-label={`Remove one ${definition.label} die`}
              >
                -
              </button>
              <output className="die-count" aria-live="polite">
                {count}
              </output>
              <button
                type="button"
                className="circle-button"
                onClick={() => onIncrement(die)}
                aria-label={`Add one ${definition.label} die`}
              >
                +
              </button>
            </div>
          </li>
        )
      })}
    </ul>

    <div className="quick-actions">
      <button type="button" className="ghost-button" onClick={onQuickBoost}>
        Add Boost
      </button>
      <button type="button" className="ghost-button" onClick={onQuickSetback}>
        Add Setback
      </button>
    </div>

    <div className="upgrade-grid">
      <button type="button" className="ghost-button" onClick={onUpgradeAbility}>
        Upgrade Ability -&gt; Proficiency
      </button>
      <button type="button" className="ghost-button" onClick={onDowngradeProficiency}>
        Downgrade Proficiency -&gt; Ability
      </button>
      <button type="button" className="ghost-button" onClick={onUpgradeDifficulty}>
        Upgrade Difficulty -&gt; Challenge
      </button>
      <button type="button" className="ghost-button" onClick={onDowngradeChallenge}>
        Downgrade Challenge -&gt; Difficulty
      </button>
    </div>

    <div className="primary-actions">
      <button type="button" className="clear-button" onClick={onClear}>
        Clear Pool
      </button>
      <button type="button" className="roll-button" onClick={onRoll} disabled={!canRoll}>
        Roll
      </button>
    </div>
  </section>
)
