export type SymbolCode = 'S' | 'F' | 'A' | 'T' | 'TRI' | 'DES' | 'L' | 'D'

export type DieType =
  | 'boost'
  | 'ability'
  | 'proficiency'
  | 'setback'
  | 'difficulty'
  | 'challenge'
  | 'force'

export type DieFace = readonly SymbolCode[]

export type DicePool = Record<DieType, number>

export interface DieRoll {
  die: DieType
  face: DieFace
}

export interface RollDetails {
  rolls: DieRoll[]
  symbols: SymbolCode[]
}
