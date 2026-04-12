import { describe, expect, it } from 'vitest'
import { ORACLE_FACES, rollOracleDie } from './oracle'

describe('oracle die', () => {
  it('keeps the expected face distribution', () => {
    expect(ORACLE_FACES).toEqual(['YES', 'YES', 'NO', 'NO', 'MAYBE', 'MAYBE'])
  })

  it('maps deterministic rng values onto the six faces', () => {
    expect(rollOracleDie(() => 0)).toBe('YES')
    expect(rollOracleDie(() => 0.2)).toBe('YES')
    expect(rollOracleDie(() => 0.34)).toBe('NO')
    expect(rollOracleDie(() => 0.51)).toBe('NO')
    expect(rollOracleDie(() => 0.68)).toBe('MAYBE')
    expect(rollOracleDie(() => 0.99)).toBe('MAYBE')
  })
})
