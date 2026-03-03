import type { SymbolCode } from './types'

export interface SymbolTotals {
  success: number
  failure: number
  advantage: number
  threat: number
  triumph: number
  despair: number
  light: number
  dark: number
}

export interface ResolvedRoll {
  totals: SymbolTotals
  effectiveSuccesses: number
  effectiveFailures: number
  netSuccess: number
  netAdvantage: number
  outcome: string
}

const emptyTotals = (): SymbolTotals => ({
  success: 0,
  failure: 0,
  advantage: 0,
  threat: 0,
  triumph: 0,
  despair: 0,
  light: 0,
  dark: 0,
})

const pluralize = (count: number, noun: string): string => (count === 1 ? noun : `${noun}S`)

export const buildOutcomeLine = (netSuccess: number, triumphs: number, despairs: number): string => {
  const status = netSuccess >= 1 ? 'SUCCESS' : 'FAILURE'
  const details: string[] = []

  if (triumphs > 0) {
    details.push(`${triumphs} ${pluralize(triumphs, 'TRIUMPH')}`)
  }

  if (despairs > 0) {
    details.push(`${despairs} ${pluralize(despairs, 'DESPAIR')}`)
  }

  return details.length > 0 ? `${status} + ${details.join(' + ')}` : status
}

export const resolveSymbols = (symbols: SymbolCode[]): ResolvedRoll => {
  const totals = emptyTotals()

  for (const symbol of symbols) {
    if (symbol === 'S') totals.success += 1
    if (symbol === 'F') totals.failure += 1
    if (symbol === 'A') totals.advantage += 1
    if (symbol === 'T') totals.threat += 1
    if (symbol === 'TRI') totals.triumph += 1
    if (symbol === 'DES') totals.despair += 1
    if (symbol === 'L') totals.light += 1
    if (symbol === 'D') totals.dark += 1
  }

  const effectiveSuccesses = totals.success + totals.triumph
  const effectiveFailures = totals.failure + totals.despair
  const netSuccess = effectiveSuccesses - effectiveFailures
  const netAdvantage = totals.advantage - totals.threat
  const outcome = buildOutcomeLine(netSuccess, totals.triumph, totals.despair)

  return {
    totals,
    effectiveSuccesses,
    effectiveFailures,
    netSuccess,
    netAdvantage,
    outcome,
  }
}
