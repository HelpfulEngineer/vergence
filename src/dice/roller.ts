import { DICE_FACES, DIE_ORDER } from './diceTables'
import type { DicePool, DieType, RollDetails, SymbolCode } from './types'

export type RngFn = () => number

const toSafeIndex = (index: number, max: number): number => {
  if (index < 0) {
    return 0
  }

  if (index > max) {
    return max
  }

  return index
}

export const rollDie = (die: DieType, rng: RngFn = Math.random): SymbolCode[] => {
  const faces = DICE_FACES[die]
  const candidateIndex = Math.floor(rng() * faces.length)
  const faceIndex = toSafeIndex(candidateIndex, faces.length - 1)
  return [...faces[faceIndex]]
}

export const rollPool = (pool: DicePool, rng: RngFn = Math.random): RollDetails => {
  const rolls: RollDetails['rolls'] = []
  const symbols: SymbolCode[] = []

  for (const die of DIE_ORDER) {
    const count = pool[die]

    for (let index = 0; index < count; index += 1) {
      const face = rollDie(die, rng)
      rolls.push({ die, face })
      symbols.push(...face)
    }
  }

  return { rolls, symbols }
}
