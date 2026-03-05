import { DICE, DIE_ORDER } from '../dice/diceTables'
import type { DieRoll, DieType } from '../dice/types'

interface RollDetailProps {
  rolls: DieRoll[]
}

interface GroupedRolls {
  die: DieType
  rolls: DieRoll[]
}

const formatFace = (face: readonly string[]): string => (face.length > 0 ? face.join(' ') : '-')

export const RollDetail = ({ rolls }: RollDetailProps) => {
  const grouped = new Map<DieType, DieRoll[]>(
    DIE_ORDER.map((die): [DieType, DieRoll[]] => [die, []]),
  )

  for (const roll of rolls) {
    const collection = grouped.get(roll.die)

    if (collection) {
      collection.push(roll)
    }
  }

  const groups: GroupedRolls[] = DIE_ORDER.map((die) => ({ die, rolls: grouped.get(die) ?? [] })).filter(
    (group) => group.rolls.length > 0,
  )

  if (groups.length === 0) {
    return null
  }

  return (
    <section className="roll-detail-panel" aria-label="Per-die roll detail">
      <header className="roll-detail-header">
        <h3>Per-Die Breakdown</h3>
      </header>

      <div className="roll-detail-groups">
        {groups.map((group) => (
          <div key={group.die} className="roll-detail-group">
            <p className="roll-detail-group-title">
              {DICE[group.die].label} ({group.rolls.length})
            </p>
            <div className="roll-detail-chips">
              {group.rolls.map((roll, index) => (
                <span
                  key={`${group.die}-${index}`}
                  className={`roll-detail-chip ${roll.face.length === 0 ? 'roll-detail-chip-blank' : ''}`}
                >
                  {formatFace(roll.face)}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
