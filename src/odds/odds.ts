import type { DicePool } from '../dice/types'
import { clearIntelCache, computeIntel, makeIntelCacheKey, type OddsPoolInput } from './intel'

export interface OddsResult {
  pSuccess: number
  pFailure: number
  expectedNetSuccess: number
}

export { type OddsPoolInput }

export const makeOddsCacheKey = (input: OddsPoolInput | DicePool): string =>
  makeIntelCacheKey(input)

export const computeOdds = (poolCounts: OddsPoolInput | DicePool): OddsResult => {
  const intel = computeIntel(poolCounts, { includeAdvanced: false })

  return {
    pSuccess: intel.pSuccess,
    pFailure: intel.pFailure,
    expectedNetSuccess: intel.expectedNetSuccess,
  }
}

export const clearOddsCache = (): void => {
  clearIntelCache()
}
