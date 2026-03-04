export interface Fraction {
  readonly numerator: bigint
  readonly denominator: bigint
}

const gcd = (a: bigint, b: bigint): bigint => {
  let left = a < 0n ? -a : a
  let right = b < 0n ? -b : b

  while (right !== 0n) {
    const remainder = left % right
    left = right
    right = remainder
  }

  return left
}

export const makeFraction = (numerator: bigint, denominator: bigint = 1n): Fraction => {
  if (denominator === 0n) {
    throw new Error('Fraction denominator cannot be zero')
  }

  if (numerator === 0n) {
    return { numerator: 0n, denominator: 1n }
  }

  const denominatorSign = denominator < 0n ? -1n : 1n
  const normalizedNumerator = numerator * denominatorSign
  const normalizedDenominator = denominator * denominatorSign
  const divisor = gcd(normalizedNumerator, normalizedDenominator)

  return {
    numerator: normalizedNumerator / divisor,
    denominator: normalizedDenominator / divisor,
  }
}

export const ZERO_FRACTION: Fraction = Object.freeze({ numerator: 0n, denominator: 1n })
export const ONE_FRACTION: Fraction = Object.freeze({ numerator: 1n, denominator: 1n })

export const addFractions = (left: Fraction, right: Fraction): Fraction =>
  makeFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  )

export const subtractFractions = (left: Fraction, right: Fraction): Fraction =>
  makeFraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  )

export const multiplyFractions = (left: Fraction, right: Fraction): Fraction =>
  makeFraction(left.numerator * right.numerator, left.denominator * right.denominator)

export const multiplyFractionByInt = (fraction: Fraction, integer: number): Fraction =>
  makeFraction(fraction.numerator * BigInt(integer), fraction.denominator)

export const fractionToNumber = (fraction: Fraction): number =>
  Number(fraction.numerator) / Number(fraction.denominator)
