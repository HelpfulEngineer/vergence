import { describe, expect, it } from 'vitest'
import { clearOddsCache, computeOdds } from '../odds/odds'
import { DICE_FACES } from './diceTables'
import type { DieType, SymbolCode } from './types'

const VALID_SYMBOLS = new Set<SymbolCode>(['S', 'F', 'A', 'T', 'TRI', 'DES', 'L', 'D'])

const EXPECTED_FACE_COUNTS: Record<DieType, number> = {
  boost: 6,
  setback: 6,
  ability: 8,
  difficulty: 8,
  proficiency: 12,
  challenge: 12,
  force: 12,
}

describe('diceTables invariants', () => {
  it('keeps expected number of faces per die', () => {
    for (const [die, expectedFaceCount] of Object.entries(EXPECTED_FACE_COUNTS) as [DieType, number][]) {
      expect(DICE_FACES[die]).toHaveLength(expectedFaceCount)
    }
  })

  it('only uses valid symbol codes in all faces', () => {
    for (const faces of Object.values(DICE_FACES)) {
      for (const face of faces) {
        for (const symbol of face) {
          expect(VALID_SYMBOLS.has(symbol)).toBe(true)
        }
      }
    }
  })

  it('keeps success/failure odds normalized for representative pools', () => {
    clearOddsCache()

    const pools = [
      { ability: 1 },
      { boost: 1, difficulty: 1 },
      { proficiency: 2, setback: 1, challenge: 1, force: 2 },
    ] as const

    for (const pool of pools) {
      const odds = computeOdds(pool)

      expect(odds.pSuccess).toBeGreaterThanOrEqual(0)
      expect(odds.pSuccess).toBeLessThanOrEqual(1)
      expect(odds.pFailure).toBeGreaterThanOrEqual(0)
      expect(odds.pFailure).toBeLessThanOrEqual(1)
      expect(odds.pSuccess + odds.pFailure).toBeCloseTo(1, 12)
    }
  })
})
