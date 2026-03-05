import { DICE_FACES } from '../dice/diceTables'
import type { DicePool, SymbolCode } from '../dice/types'
import {
  addFractions,
  fractionToNumber,
  makeFraction,
  multiplyFractionByInt,
  multiplyFractions,
  ONE_FRACTION,
  subtractFractions,
  ZERO_FRACTION,
  type Fraction,
} from './fraction'

type CheckDieType =
  | 'boost'
  | 'ability'
  | 'proficiency'
  | 'setback'
  | 'difficulty'
  | 'challenge'

interface StateVector {
  deltaSuccess: number
  deltaAdvantage: number
  hasTriumph: boolean
  hasDespair: boolean
}

interface BasicIntelMetrics {
  pSuccess: number
  pFailure: number
  expectedNetSuccess: number
  pAdvantage: number
  pThreat: number
  expectedNetAdvantage: number
  pCinematic: number
}

interface AdvancedIntelMetrics {
  pDramaticTension: number
  pHeroMoment: number
  pCatastrophic: number
  chaosIndex: number
  chaosLabel: string
  advisoryLabel: string
  destinyConflictDetected: boolean
  mostLikelyOutcome: {
    deltaSuccess: number
    deltaAdvantage: number
    hasTriumph: boolean
    hasDespair: boolean
    probability: number
  }
}

export interface IntelResult extends BasicIntelMetrics, AdvancedIntelMetrics {}

export interface IntelOptions {
  includeAdvanced?: boolean
}

export type OddsPoolInput = Partial<Record<CheckDieType | 'force', number>>

type StatePmf = Map<string, Fraction>

interface DecodedStateEntry {
  state: StateVector
  probability: Fraction
}

interface IntelModel {
  pmf: StatePmf
  entries: DecodedStateEntry[]
}

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

const defaultAdvancedMetrics: AdvancedIntelMetrics = {
  pDramaticTension: 0,
  pHeroMoment: 0,
  pCatastrophic: 0,
  chaosIndex: 0,
  chaosLabel: 'Predictable',
  advisoryLabel: 'ROUTINE',
  destinyConflictDetected: false,
  mostLikelyOutcome: {
    deltaSuccess: 0,
    deltaAdvantage: 0,
    hasTriumph: false,
    hasDespair: false,
    probability: 1,
  },
}

const baseModelCache = new Map<string, IntelModel>()
const basicMetricsCache = new Map<string, BasicIntelMetrics>()
const advancedMetricsCache = new Map<string, AdvancedIntelMetrics>()

const encodeState = (state: StateVector): string =>
  `${state.deltaSuccess}|${state.deltaAdvantage}|${state.hasTriumph ? 1 : 0}|${state.hasDespair ? 1 : 0}`

const decodeState = (encoded: string): StateVector => {
  const [successRaw, advantageRaw, triumphRaw, despairRaw] = encoded.split('|')

  return {
    deltaSuccess: Number.parseInt(successRaw, 10),
    deltaAdvantage: Number.parseInt(advantageRaw, 10),
    hasTriumph: triumphRaw === '1',
    hasDespair: despairRaw === '1',
  }
}

const clampCount = (value: number | undefined): number => {
  if (!Number.isFinite(value)) {
    return 0
  }

  return value && value > 0 ? Math.floor(value) : 0
}

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

const faceToIncrement = (face: readonly SymbolCode[]): StateVector => {
  let deltaSuccess = 0
  let deltaAdvantage = 0
  let hasTriumph = false
  let hasDespair = false

  for (const symbol of face) {
    if (symbol === 'S') deltaSuccess += 1
    if (symbol === 'F') deltaSuccess -= 1
    if (symbol === 'A') deltaAdvantage += 1
    if (symbol === 'T') deltaAdvantage -= 1
    if (symbol === 'TRI') {
      deltaSuccess += 1
      hasTriumph = true
    }
    if (symbol === 'DES') {
      deltaSuccess -= 1
      hasDespair = true
    }
  }

  return { deltaSuccess, deltaAdvantage, hasTriumph, hasDespair }
}

const buildDiePmf = (die: CheckDieType): StatePmf => {
  const faces = DICE_FACES[die]
  const faceProbability = makeFraction(1n, BigInt(faces.length))
  const diePmf: StatePmf = new Map()

  for (const face of faces) {
    const increment = faceToIncrement(face)
    const key = encodeState(increment)
    const current = diePmf.get(key) ?? ZERO_FRACTION
    diePmf.set(key, addFractions(current, faceProbability))
  }

  return diePmf
}

const DIE_PMFS: Record<CheckDieType, StatePmf> = {
  boost: buildDiePmf('boost'),
  ability: buildDiePmf('ability'),
  proficiency: buildDiePmf('proficiency'),
  setback: buildDiePmf('setback'),
  difficulty: buildDiePmf('difficulty'),
  challenge: buildDiePmf('challenge'),
}

const createIdentityPmf = (): StatePmf =>
  new Map([
    [
      encodeState({
        deltaSuccess: 0,
        deltaAdvantage: 0,
        hasTriumph: false,
        hasDespair: false,
      }),
      ONE_FRACTION,
    ],
  ])

const convolveStatePmfs = (left: StatePmf, right: StatePmf): StatePmf => {
  const result: StatePmf = new Map()

  for (const [leftKey, leftProbability] of left) {
    const leftState = decodeState(leftKey)

    for (const [rightKey, rightProbability] of right) {
      const rightState = decodeState(rightKey)
      const nextState: StateVector = {
        deltaSuccess: leftState.deltaSuccess + rightState.deltaSuccess,
        deltaAdvantage: leftState.deltaAdvantage + rightState.deltaAdvantage,
        hasTriumph: leftState.hasTriumph || rightState.hasTriumph,
        hasDespair: leftState.hasDespair || rightState.hasDespair,
      }
      const nextKey = encodeState(nextState)
      const probability = multiplyFractions(leftProbability, rightProbability)
      const current = result.get(nextKey) ?? ZERO_FRACTION
      result.set(nextKey, addFractions(current, probability))
    }
  }

  return result
}

const decodeEntries = (pmf: StatePmf): DecodedStateEntry[] =>
  Array.from(pmf.entries()).map(([key, probability]) => ({
    state: decodeState(key),
    probability,
  }))

const probabilityWhere = (
  entries: DecodedStateEntry[],
  predicate: (state: StateVector) => boolean,
): Fraction => {
  let total = ZERO_FRACTION

  for (const entry of entries) {
    if (predicate(entry.state)) {
      total = addFractions(total, entry.probability)
    }
  }

  return total
}

const expectedDelta = (
  entries: DecodedStateEntry[],
  selector: (state: StateVector) => number,
): Fraction => {
  let total = ZERO_FRACTION

  for (const entry of entries) {
    total = addFractions(total, multiplyFractionByInt(entry.probability, selector(entry.state)))
  }

  return total
}

const expectedSquareDelta = (
  entries: DecodedStateEntry[],
  selector: (state: StateVector) => number,
): Fraction => {
  let total = ZERO_FRACTION

  for (const entry of entries) {
    const value = selector(entry.state)
    total = addFractions(total, multiplyFractionByInt(entry.probability, value * value))
  }

  return total
}

const clamp01 = (value: number): number => {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

const chaosLabelForValue = (value: number): string => {
  if (value <= 0.2) return 'Predictable'
  if (value <= 0.5) return 'Dynamic'
  if (value <= 0.8) return 'Chaotic'
  return "GM's Playground"
}

const advisoryLabelForSuccess = (pSuccess: number): string => {
  const percent = pSuccess * 100

  if (percent < 15) return 'ABSOLUTELY NOT'
  if (percent < 30) return 'THIS WAS A BAD IDEA'
  if (percent < 45) return 'HIGH RISK'
  if (percent < 60) return 'CONTESTED'
  if (percent < 75) return 'FAVORABLE'
  return 'ROUTINE'
}

const compareFractions = (left: Fraction, right: Fraction): number => {
  const leftScaled = left.numerator * right.denominator
  const rightScaled = right.numerator * left.denominator

  if (leftScaled > rightScaled) return 1
  if (leftScaled < rightScaled) return -1
  return 0
}

const pickMostLikelyOutcome = (
  entries: DecodedStateEntry[],
): AdvancedIntelMetrics['mostLikelyOutcome'] => {
  const compareTieBreak = (candidate: StateVector, winner: StateVector): number => {
    const candidateTuple = [
      candidate.deltaSuccess,
      candidate.deltaAdvantage,
      candidate.hasTriumph ? 1 : 0,
      candidate.hasDespair ? 0 : 1,
    ]
    const winnerTuple = [
      winner.deltaSuccess,
      winner.deltaAdvantage,
      winner.hasTriumph ? 1 : 0,
      winner.hasDespair ? 0 : 1,
    ]

    for (let index = 0; index < candidateTuple.length; index += 1) {
      if (candidateTuple[index] > winnerTuple[index]) return 1
      if (candidateTuple[index] < winnerTuple[index]) return -1
    }

    return 0
  }

  let winner: DecodedStateEntry | null = null

  for (const entry of entries) {
    if (!winner) {
      winner = entry
      continue
    }

    const probabilityCompare = compareFractions(entry.probability, winner.probability)

    if (probabilityCompare > 0) {
      winner = entry
      continue
    }

    if (probabilityCompare < 0) {
      continue
    }

    if (compareTieBreak(entry.state, winner.state) > 0) {
      winner = entry
    }
  }

  if (!winner) {
    return defaultAdvancedMetrics.mostLikelyOutcome
  }

  return {
    deltaSuccess: winner.state.deltaSuccess,
    deltaAdvantage: winner.state.deltaAdvantage,
    hasTriumph: winner.state.hasTriumph,
    hasDespair: winner.state.hasDespair,
    probability: fractionToNumber(winner.probability),
  }
}

const buildModel = (poolCounts: OddsPoolInput | DicePool): IntelModel => {
  const counts = normalizeCounts(poolCounts)
  let combinedPmf = createIdentityPmf()

  for (const die of CHECK_DICE_ORDER) {
    for (let index = 0; index < counts[die]; index += 1) {
      combinedPmf = convolveStatePmfs(combinedPmf, DIE_PMFS[die])
    }
  }

  return {
    pmf: combinedPmf,
    entries: decodeEntries(combinedPmf),
  }
}

const getModel = (poolCounts: OddsPoolInput | DicePool): IntelModel => {
  const key = makeIntelCacheKey(poolCounts)
  const cached = baseModelCache.get(key)

  if (cached) {
    return cached
  }

  const model = buildModel(poolCounts)
  baseModelCache.set(key, model)
  return model
}

const computeBasicMetrics = (poolCounts: OddsPoolInput | DicePool): BasicIntelMetrics => {
  const key = makeIntelCacheKey(poolCounts)
  const cached = basicMetricsCache.get(key)

  if (cached) {
    return cached
  }

  const { entries } = getModel(poolCounts)
  const success = probabilityWhere(entries, (state) => state.deltaSuccess >= 1)
  const failure = subtractFractions(ONE_FRACTION, success)
  const advantage = probabilityWhere(entries, (state) => state.deltaAdvantage >= 1)
  const threat = probabilityWhere(entries, (state) => state.deltaAdvantage <= -1)
  const cinematic = probabilityWhere(entries, (state) => state.hasTriumph || state.hasDespair)
  const expectedNetSuccess = expectedDelta(entries, (state) => state.deltaSuccess)
  const expectedNetAdvantage = expectedDelta(entries, (state) => state.deltaAdvantage)

  const basic: BasicIntelMetrics = {
    pSuccess: fractionToNumber(success),
    pFailure: fractionToNumber(failure),
    expectedNetSuccess: fractionToNumber(expectedNetSuccess),
    pAdvantage: fractionToNumber(advantage),
    pThreat: fractionToNumber(threat),
    expectedNetAdvantage: fractionToNumber(expectedNetAdvantage),
    pCinematic: fractionToNumber(cinematic),
  }

  basicMetricsCache.set(key, basic)
  return basic
}

const computeAdvancedMetrics = (
  poolCounts: OddsPoolInput | DicePool,
  basic: BasicIntelMetrics,
): AdvancedIntelMetrics => {
  const key = makeIntelCacheKey(poolCounts)
  const cached = advancedMetricsCache.get(key)

  if (cached) {
    return cached
  }

  const { entries } = getModel(poolCounts)

  const dramaticTension = probabilityWhere(
    entries,
    (state) =>
      (state.deltaSuccess >= 1 && state.deltaAdvantage < 0) ||
      (state.deltaSuccess < 1 && state.deltaAdvantage > 0),
  )
  const heroMoment = probabilityWhere(
    entries,
    (state) => state.deltaSuccess >= 2 && state.deltaAdvantage >= 2,
  )
  const catastrophic = probabilityWhere(
    entries,
    (state) => state.deltaSuccess < 1 && state.hasDespair,
  )
  const triumphProbability = probabilityWhere(entries, (state) => state.hasTriumph)
  const despairProbability = probabilityWhere(entries, (state) => state.hasDespair)

  const expectedSuccess = expectedDelta(entries, (state) => state.deltaSuccess)
  const expectedSuccessSquared = expectedSquareDelta(entries, (state) => state.deltaSuccess)
  const expectedAdvantage = expectedDelta(entries, (state) => state.deltaAdvantage)
  const expectedAdvantageSquared = expectedSquareDelta(entries, (state) => state.deltaAdvantage)

  const successMean = fractionToNumber(expectedSuccess)
  const successMeanSquared = successMean * successMean
  const successSecondMoment = fractionToNumber(expectedSuccessSquared)
  const successVariance = Math.max(0, successSecondMoment - successMeanSquared)
  const successStdDev = Math.sqrt(successVariance)

  const advantageMean = fractionToNumber(expectedAdvantage)
  const advantageMeanSquared = advantageMean * advantageMean
  const advantageSecondMoment = fractionToNumber(expectedAdvantageSquared)
  const advantageVariance = Math.max(0, advantageSecondMoment - advantageMeanSquared)
  const advantageStdDev = Math.sqrt(advantageVariance)

  const chaosIndex = clamp01(
    (successStdDev / (successStdDev + 1)) * 0.5 + (advantageStdDev / (advantageStdDev + 1)) * 0.5,
  )

  const advanced: AdvancedIntelMetrics = {
    pDramaticTension: fractionToNumber(dramaticTension),
    pHeroMoment: fractionToNumber(heroMoment),
    pCatastrophic: fractionToNumber(catastrophic),
    chaosIndex,
    chaosLabel: chaosLabelForValue(chaosIndex),
    advisoryLabel: advisoryLabelForSuccess(basic.pSuccess),
    destinyConflictDetected:
      fractionToNumber(triumphProbability) >= 0.05 && fractionToNumber(despairProbability) >= 0.05,
    mostLikelyOutcome: pickMostLikelyOutcome(entries),
  }

  advancedMetricsCache.set(key, advanced)
  return advanced
}

export const makeIntelCacheKey = (input: OddsPoolInput | DicePool): string => {
  const counts = normalizeCounts(input)
  return CHECK_DICE_ORDER.map((die) => `${SHORT_KEY[die]}${counts[die]}`).join(' ')
}

export const computeIntel = (
  poolCounts: OddsPoolInput | DicePool,
  options: IntelOptions = {},
): IntelResult => {
  const basic = computeBasicMetrics(poolCounts)

  if (!options.includeAdvanced) {
    return {
      ...basic,
      ...defaultAdvancedMetrics,
      advisoryLabel: advisoryLabelForSuccess(basic.pSuccess),
    }
  }

  const advanced = computeAdvancedMetrics(poolCounts, basic)
  return {
    ...basic,
    ...advanced,
  }
}

export const getIntelDebugProbabilityTotal = (poolCounts: OddsPoolInput | DicePool): number => {
  const { entries } = getModel(poolCounts)
  let total = ZERO_FRACTION

  for (const entry of entries) {
    total = addFractions(total, entry.probability)
  }

  return fractionToNumber(total)
}

export const clearIntelCache = (): void => {
  baseModelCache.clear()
  basicMetricsCache.clear()
  advancedMetricsCache.clear()
}
