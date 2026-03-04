import { DICE_FACES } from '../dice/diceTables'
import type { DicePool, SymbolCode } from '../dice/types'
import { fractionToNumber, ONE_FRACTION, subtractFractions } from './fraction'
import {
  convolvePmfs,
  createIdentityPmf,
  createUniformPmf,
  expectedValueFromPmf,
  probabilityFromPmf,
  type SuccessPmf,
} from './pmf'

type CheckDieType =
  | 'boost'
  | 'ability'
  | 'proficiency'
  | 'setback'
  | 'difficulty'
  | 'challenge'

export interface OddsResult {
  pSuccess: number
  pFailure: number
  expectedNetSuccess: number
}

export type OddsPoolInput = Partial<Record<CheckDieType | 'force', number>>

const CHECK_DICE_ORDER: CheckDieType[] = [
  'boost',
  'ability',
  'proficiency',
  'setback',
  'difficulty',
  'challenge',
]

const SHORT_KEY: Record<CheckDieType, string> = {
  boost: 'B',
  ability: 'A',
  proficiency: 'P',
  setback: 'Sb',
  difficulty: 'D',
  challenge: 'C',
}

const symbolToDeltaSuccess = (symbol: SymbolCode): number => {
  if (symbol === 'S' || symbol === 'TRI') return 1
  if (symbol === 'F' || symbol === 'DES') return -1
  return 0
}

const clampCount = (value: number | undefined): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return value && value > 0 ? Math.floor(value) : 0
}

const buildDiePmf = (die: CheckDieType): SuccessPmf => {
  const deltas = DICE_FACES[die].map((face) =>
    face.reduce((delta, symbol) => delta + symbolToDeltaSuccess(symbol), 0),
  )

  return createUniformPmf(deltas)
}

const DIE_PMFS: Record<CheckDieType, SuccessPmf> = {
  boost: buildDiePmf('boost'),
  ability: buildDiePmf('ability'),
  proficiency: buildDiePmf('proficiency'),
  setback: buildDiePmf('setback'),
  difficulty: buildDiePmf('difficulty'),
  challenge: buildDiePmf('challenge'),
}

const oddsCache = new Map<string, OddsResult>()

const normalizeCounts = (
  input: OddsPoolInput | DicePool,
): Record<CheckDieType, number> => ({
  boost: clampCount(input.boost),
  ability: clampCount(input.ability),
  proficiency: clampCount(input.proficiency),
  setback: clampCount(input.setback),
  difficulty: clampCount(input.difficulty),
  challenge: clampCount(input.challenge),
})

export const makeOddsCacheKey = (input: OddsPoolInput | DicePool): string => {
  const counts = normalizeCounts(input)
  return CHECK_DICE_ORDER.map((die) => `${SHORT_KEY[die]}${counts[die]}`).join(' ')
}

export const computeOdds = (poolCounts: OddsPoolInput | DicePool): OddsResult => {
  const cacheKey = makeOddsCacheKey(poolCounts)
  const cached = oddsCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const counts = normalizeCounts(poolCounts)
  let combinedPmf = createIdentityPmf()

  for (const die of CHECK_DICE_ORDER) {
    for (let count = 0; count < counts[die]; count += 1) {
      combinedPmf = convolvePmfs(combinedPmf, DIE_PMFS[die])
    }
  }

  const successFraction = probabilityFromPmf(combinedPmf, (deltaSuccess) => deltaSuccess >= 1)
  const failureFraction = subtractFractions(ONE_FRACTION, successFraction)
  const expectedNetSuccess = expectedValueFromPmf(combinedPmf)

  const result: OddsResult = {
    pSuccess: fractionToNumber(successFraction),
    pFailure: fractionToNumber(failureFraction),
    expectedNetSuccess: fractionToNumber(expectedNetSuccess),
  }

  oddsCache.set(cacheKey, result)
  return result
}

export const clearOddsCache = (): void => {
  oddsCache.clear()
}
