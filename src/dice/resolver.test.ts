import { describe, expect, it } from 'vitest'
import { buildOutcomeLine, resolveSymbols } from './resolver'

describe('resolveSymbols', () => {
  it('handles success/failure and advantage/threat cancellation with triumph/despair triggers', () => {
    const result = resolveSymbols(['S', 'F', 'TRI', 'DES', 'A', 'T', 'L', 'D', 'D'])

    expect(result.netSuccess).toBe(0)
    expect(result.netAdvantage).toBe(0)
    expect(result.totals.triumph).toBe(1)
    expect(result.totals.despair).toBe(1)
    expect(result.totals.light).toBe(1)
    expect(result.totals.dark).toBe(2)
    expect(result.outcome).toBe('FAILURE + 1 TRIUMPH + 1 DESPAIR')
  })

  it('counts triumph as a success contribution for outcome resolution', () => {
    const result = resolveSymbols(['TRI', 'TRI', 'F'])

    expect(result.effectiveSuccesses).toBe(2)
    expect(result.effectiveFailures).toBe(1)
    expect(result.netSuccess).toBe(1)
    expect(result.outcome).toBe('SUCCESS + 2 TRIUMPHS')
  })
})

describe('buildOutcomeLine', () => {
  it('returns base status when there are no trigger symbols', () => {
    expect(buildOutcomeLine(2, 0, 0)).toBe('SUCCESS')
    expect(buildOutcomeLine(0, 0, 0)).toBe('FAILURE')
  })
})
