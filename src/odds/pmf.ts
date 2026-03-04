import {
  addFractions,
  type Fraction,
  fractionToNumber,
  makeFraction,
  multiplyFractionByInt,
  multiplyFractions,
  ONE_FRACTION,
  ZERO_FRACTION,
} from './fraction'

export type SuccessPmf = Map<number, Fraction>

export const createUniformPmf = (deltas: number[]): SuccessPmf => {
  const faceCount = BigInt(deltas.length)
  const unitProbability = makeFraction(1n, faceCount)
  const pmf: SuccessPmf = new Map()

  for (const delta of deltas) {
    const current = pmf.get(delta) ?? ZERO_FRACTION
    pmf.set(delta, addFractions(current, unitProbability))
  }

  return pmf
}

export const convolvePmfs = (left: SuccessPmf, right: SuccessPmf): SuccessPmf => {
  const result: SuccessPmf = new Map()

  for (const [leftDelta, leftProbability] of left) {
    for (const [rightDelta, rightProbability] of right) {
      const delta = leftDelta + rightDelta
      const probability = multiplyFractions(leftProbability, rightProbability)
      const current = result.get(delta) ?? ZERO_FRACTION
      result.set(delta, addFractions(current, probability))
    }
  }

  return result
}

export const probabilityFromPmf = (
  pmf: SuccessPmf,
  predicate: (deltaSuccess: number) => boolean,
): Fraction => {
  let probability = ZERO_FRACTION

  for (const [deltaSuccess, value] of pmf) {
    if (predicate(deltaSuccess)) {
      probability = addFractions(probability, value)
    }
  }

  return probability
}

export const expectedValueFromPmf = (pmf: SuccessPmf): Fraction => {
  let expectedValue = ZERO_FRACTION

  for (const [deltaSuccess, probability] of pmf) {
    expectedValue = addFractions(expectedValue, multiplyFractionByInt(probability, deltaSuccess))
  }

  return expectedValue
}

export const totalProbabilityFromPmf = (pmf: SuccessPmf): Fraction =>
  probabilityFromPmf(pmf, () => true)

export const probabilityForDelta = (pmf: SuccessPmf, deltaSuccess: number): Fraction =>
  pmf.get(deltaSuccess) ?? ZERO_FRACTION

export const createIdentityPmf = (): SuccessPmf => new Map([[0, ONE_FRACTION]])

export const pmfToNumberMap = (pmf: SuccessPmf): Map<number, number> => {
  const asNumber = new Map<number, number>()

  for (const [deltaSuccess, probability] of pmf) {
    asNumber.set(deltaSuccess, fractionToNumber(probability))
  }

  return asNumber
}
