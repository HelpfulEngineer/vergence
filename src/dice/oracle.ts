export type OracleFace = 'YES' | 'NO' | 'MAYBE'

export const ORACLE_FACES: readonly OracleFace[] = [
  'YES',
  'YES',
  'NO',
  'NO',
  'MAYBE',
  'MAYBE',
]

export const rollOracleDie = (rng: () => number = Math.random): OracleFace => {
  const faceIndex = Math.min(
    ORACLE_FACES.length - 1,
    Math.max(0, Math.floor(rng() * ORACLE_FACES.length)),
  )

  return ORACLE_FACES[faceIndex]
}
