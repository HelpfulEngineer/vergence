import { DICE, DIE_ORDER } from './diceTables'
import type { DicePool, DieType } from './types'

const clampCount = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return value > 0 ? Math.floor(value) : 0
}

export const createEmptyPool = (): DicePool => ({
  boost: 0,
  ability: 0,
  proficiency: 0,
  setback: 0,
  difficulty: 0,
  challenge: 0,
  force: 0,
})

export const adjustDieCount = (pool: DicePool, die: DieType, delta: number): DicePool => {
  const nextPool: DicePool = { ...pool }
  nextPool[die] = clampCount(nextPool[die] + delta)
  return nextPool
}

export const upgradeAbilityToProficiency = (pool: DicePool): DicePool => {
  const nextPool: DicePool = { ...pool }

  if (nextPool.ability > 0) {
    nextPool.ability -= 1
  }

  nextPool.proficiency += 1
  return nextPool
}

export const downgradeProficiencyToAbility = (pool: DicePool): DicePool => {
  if (pool.proficiency < 1) {
    return pool
  }

  const nextPool: DicePool = { ...pool }
  nextPool.proficiency -= 1
  nextPool.ability += 1
  return nextPool
}

export const upgradeDifficultyToChallenge = (pool: DicePool): DicePool => {
  const nextPool: DicePool = { ...pool }

  if (nextPool.difficulty > 0) {
    nextPool.difficulty -= 1
  }

  nextPool.challenge += 1
  return nextPool
}

export const downgradeChallengeToDifficulty = (pool: DicePool): DicePool => {
  if (pool.challenge < 1) {
    return pool
  }

  const nextPool: DicePool = { ...pool }
  nextPool.challenge -= 1
  nextPool.difficulty += 1
  return nextPool
}

export const totalDiceInPool = (pool: DicePool): number =>
  DIE_ORDER.reduce((total, die) => total + pool[die], 0)

export const formatPool = (pool: DicePool): string => {
  const parts = DIE_ORDER.filter((die) => pool[die] > 0).map((die) => `${pool[die]} ${DICE[die].shortLabel}`)

  return parts.length > 0 ? parts.join(' | ') : 'Empty Pool'
}
