import { describe, expect, it } from 'vitest'
import { clearIntelCache, computeIntel, getIntelDebugProbabilityTotal, makeIntelCacheKey } from './intel'

const closeTo = (actual: number, expected: number, precision = 10): void => {
  expect(actual).toBeCloseTo(expected, precision)
}

describe('computeIntel', () => {
  it('keeps PMF probability mass normalized to 1', () => {
    clearIntelCache()
    const total = getIntelDebugProbabilityTotal({
      boost: 1,
      ability: 2,
      proficiency: 1,
      setback: 1,
      difficulty: 1,
      challenge: 1,
      force: 3,
    })

    closeTo(total, 1, 12)
  })

  it('keeps success and failure probabilities complementary', () => {
    clearIntelCache()
    const intel = computeIntel({
      ability: 3,
      proficiency: 1,
      setback: 1,
      difficulty: 2,
      challenge: 1,
      force: 4,
    })

    closeTo(intel.pSuccess + intel.pFailure, 1, 12)
  })

  it('returns deterministic values for the same fixed pool', () => {
    clearIntelCache()
    const pool = {
      boost: 2,
      ability: 2,
      proficiency: 1,
      setback: 1,
      difficulty: 2,
      challenge: 1,
    } as const

    const first = computeIntel(pool, { includeAdvanced: true })
    const second = computeIntel(pool, { includeAdvanced: true })

    closeTo(first.pSuccess, second.pSuccess, 14)
    closeTo(first.pAdvantage, second.pAdvantage, 14)
    closeTo(first.expectedNetSuccess, second.expectedNetSuccess, 14)
    closeTo(first.expectedNetAdvantage, second.expectedNetAdvantage, 14)
    closeTo(first.mostLikelyOutcome.probability, second.mostLikelyOutcome.probability, 14)
    expect(first.mostLikelyOutcome).toEqual(second.mostLikelyOutcome)
  })

  it('keeps most likely outcome stable across cache key order variations', () => {
    clearIntelCache()
    const a = computeIntel({
      ability: 1,
      boost: 1,
      difficulty: 1,
      challenge: 1,
      proficiency: 1,
    }, { includeAdvanced: true })
    const b = computeIntel({
      challenge: 1,
      proficiency: 1,
      difficulty: 1,
      boost: 1,
      ability: 1,
      force: 7,
    }, { includeAdvanced: true })

    expect(
      makeIntelCacheKey({
        ability: 1,
        boost: 1,
        difficulty: 1,
        challenge: 1,
        proficiency: 1,
      }),
    ).toBe(
      makeIntelCacheKey({
        challenge: 1,
        proficiency: 1,
        difficulty: 1,
        boost: 1,
        ability: 1,
        force: 10,
      }),
    )

    expect(a.mostLikelyOutcome).toEqual(b.mostLikelyOutcome)
  })
})
