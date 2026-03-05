import { describe, expect, it } from 'vitest'
import { clearOddsCache, computeOdds, makeOddsCacheKey } from './odds'

const closeTo = (actual: number, expected: number, precision = 10): void => {
  expect(actual).toBeCloseTo(expected, precision)
}

describe('computeOdds', () => {
  it('returns exact-known values for a single ability die', () => {
    clearOddsCache()
    const odds = computeOdds({ ability: 1 })

    closeTo(odds.pSuccess, 0.5)
    closeTo(odds.pFailure, 0.5)
    closeTo(odds.expectedNetSuccess, 0.625)
  })

  it('satisfies probability invariants for mixed pools', () => {
    clearOddsCache()
    const odds = computeOdds({
      boost: 2,
      ability: 3,
      proficiency: 1,
      setback: 1,
      difficulty: 2,
      challenge: 1,
      force: 4,
    })

    expect(odds.pSuccess).toBeGreaterThanOrEqual(0)
    expect(odds.pSuccess).toBeLessThanOrEqual(1)
    expect(odds.pFailure).toBeGreaterThanOrEqual(0)
    expect(odds.pFailure).toBeLessThanOrEqual(1)
    closeTo(odds.pSuccess + odds.pFailure, 1, 10)
  })

  it('ignores force dice for success odds', () => {
    clearOddsCache()
    const withoutForce = computeOdds({ ability: 2, difficulty: 1, challenge: 1 })
    const withForce = computeOdds({ ability: 2, difficulty: 1, challenge: 1, force: 5 })

    closeTo(withForce.pSuccess, withoutForce.pSuccess, 12)
    closeTo(withForce.pFailure, withoutForce.pFailure, 12)
    closeTo(withForce.expectedNetSuccess, withoutForce.expectedNetSuccess, 12)
  })

  it('keeps expected value direction sensible for positive and negative dice pools', () => {
    clearOddsCache()
    const proficiencyPool = computeOdds({ proficiency: 2 })
    const challengePool = computeOdds({ challenge: 2 })
    const mixedPool = computeOdds({ proficiency: 1, challenge: 1 })

    expect(proficiencyPool.expectedNetSuccess).toBeGreaterThan(0)
    expect(challengePool.expectedNetSuccess).toBeLessThan(0)
    expect(mixedPool.expectedNetSuccess).toBeLessThan(proficiencyPool.expectedNetSuccess)
    expect(mixedPool.expectedNetSuccess).toBeGreaterThan(challengePool.expectedNetSuccess)
  })

  it('is stable across repeated calls and cache hits', () => {
    clearOddsCache()
    const keyA = makeOddsCacheKey({
      boost: 1,
      ability: 2,
      proficiency: 1,
      setback: 0,
      difficulty: 2,
      challenge: 1,
    })
    const keyB = makeOddsCacheKey({
      ability: 2,
      challenge: 1,
      boost: 1,
      proficiency: 1,
      difficulty: 2,
      setback: 0,
    })

    expect(keyA).toBe(keyB)

    const first = computeOdds({
      ability: 2,
      boost: 1,
      proficiency: 1,
      setback: 0,
      difficulty: 2,
      challenge: 1,
    })
    const second = computeOdds({
      challenge: 1,
      difficulty: 2,
      setback: 0,
      proficiency: 1,
      ability: 2,
      boost: 1,
      force: 7,
    })

    expect(second).toBe(first)
    closeTo(second.pSuccess, first.pSuccess, 12)
    closeTo(second.pFailure, first.pFailure, 12)
    closeTo(second.expectedNetSuccess, first.expectedNetSuccess, 12)
  })
})
