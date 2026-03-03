import type { DieFace, DieType } from './types'

interface DieDefinition {
  label: string
  shortLabel: string
  color: string
  faces: readonly DieFace[]
}

export const DIE_ORDER: DieType[] = [
  'boost',
  'ability',
  'proficiency',
  'setback',
  'difficulty',
  'challenge',
  'force',
]

const boostFaces: readonly DieFace[] = [
  [],
  [],
  ['S'],
  ['S', 'A'],
  ['A'],
  ['A'],
]

const setbackFaces: readonly DieFace[] = [
  [],
  [],
  ['F'],
  ['F'],
  ['T'],
  ['T'],
]

const abilityFaces: readonly DieFace[] = [
  [],
  ['S'],
  ['S'],
  ['S', 'S'],
  ['A'],
  ['A'],
  ['S', 'A'],
  ['A', 'A'],
]

const difficultyFaces: readonly DieFace[] = [
  [],
  ['F'],
  ['F', 'F'],
  ['T'],
  ['T'],
  ['T'],
  ['F', 'T'],
  ['T', 'T'],
]

const proficiencyFaces: readonly DieFace[] = [
  [],
  ['S'],
  ['S'],
  ['S', 'S'],
  ['S', 'S'],
  ['A'],
  ['S', 'A'],
  ['S', 'A'],
  ['S', 'A'],
  ['A', 'A'],
  ['A', 'A'],
  ['TRI'],
]

const challengeFaces: readonly DieFace[] = [
  [],
  ['F'],
  ['F'],
  ['F', 'F'],
  ['F', 'F'],
  ['T'],
  ['F', 'T'],
  ['F', 'T'],
  ['F', 'T'],
  ['T', 'T'],
  ['T', 'T'],
  ['DES'],
]

const forceFaces: readonly DieFace[] = [
  ['D'],
  ['D'],
  ['D'],
  ['D'],
  ['D'],
  ['D', 'D'],
  ['L'],
  ['L'],
  ['L'],
  ['L'],
  ['L', 'L'],
  ['L', 'L'],
]

export const DICE: Record<DieType, DieDefinition> = {
  boost: {
    label: 'Boost',
    shortLabel: 'B',
    color: '#4bb8ff',
    faces: boostFaces,
  },
  ability: {
    label: 'Ability',
    shortLabel: 'A',
    color: '#86d95d',
    faces: abilityFaces,
  },
  proficiency: {
    label: 'Proficiency',
    shortLabel: 'P',
    color: '#f8d548',
    faces: proficiencyFaces,
  },
  setback: {
    label: 'Setback',
    shortLabel: 'Sb',
    color: '#1f2126',
    faces: setbackFaces,
  },
  difficulty: {
    label: 'Difficulty',
    shortLabel: 'D',
    color: '#8553f2',
    faces: difficultyFaces,
  },
  challenge: {
    label: 'Challenge',
    shortLabel: 'C',
    color: '#de4d4a',
    faces: challengeFaces,
  },
  force: {
    label: 'Force',
    shortLabel: 'Frc',
    color: '#d6dfe8',
    faces: forceFaces,
  },
}

export const DICE_FACES: Record<DieType, readonly DieFace[]> = {
  boost: DICE.boost.faces,
  ability: DICE.ability.faces,
  proficiency: DICE.proficiency.faces,
  setback: DICE.setback.faces,
  difficulty: DICE.difficulty.faces,
  challenge: DICE.challenge.faces,
  force: DICE.force.faces,
}
