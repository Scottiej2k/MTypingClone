export interface WorldTheme {
  skyTop: string;
  skyBottom: string;
  hillFar: string;
  hillNear: string;
  ground: string;
  groundDark: string;
  groundTop: string;
  block: string;
  blockDark: string;
  blockText: string;
  accent: string;
  night?: boolean;
  decor: 'meadow' | 'clouds' | 'beach' | 'castle';
}

export interface World {
  id: number;
  name: string;
  tagline: string;
  theme: WorldTheme;
  levels: Level[];
}

export interface Level {
  /** Stable id used for saving progress, e.g. "1-3". */
  id: string;
  world: number;
  index: number;
  title: string;
  /** Keys introduced in this level; they show up more often. */
  newKeys: string[];
  /** Every key that can appear in this level. */
  pool: string[];
  /** Number of letters to type. */
  length: number;
  /** A fixed sequence instead of random letters (e.g. the alphabet). */
  fixed?: string;
}

const HOME = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];
const TOP = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const BOTTOM = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'];
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

interface LevelSpec {
  title: string;
  newKeys: string[];
  pool?: string[];
  length?: number;
  fixed?: string;
}

/** Builds the levels of a world, where each level's pool includes all keys introduced before it. */
function buildWorld(world: number, basePool: string[], specs: LevelSpec[]): Level[] {
  let pool = [...basePool];
  return specs.map((spec, i) => {
    pool = [...new Set([...pool, ...spec.newKeys])];
    return {
      id: `${world}-${i + 1}`,
      world,
      index: i,
      title: spec.title,
      newKeys: spec.newKeys,
      pool: spec.pool ?? pool,
      length: spec.fixed ? spec.fixed.length : (spec.length ?? 24),
      fixed: spec.fixed,
    };
  });
}

export const WORLDS: World[] = [
  {
    id: 1,
    name: 'Carrot Meadow',
    tagline: 'Meet the home row',
    theme: {
      skyTop: '#8fd8ff',
      skyBottom: '#dff6ff',
      hillFar: '#a8e6a3',
      hillNear: '#7fd67f',
      ground: '#c98a5a',
      groundDark: '#a86c42',
      groundTop: '#6cc76a',
      block: '#ffb347',
      blockDark: '#e08a1e',
      blockText: '#6b3a00',
      accent: '#ff7a59',
      decor: 'meadow',
    },
    levels: buildWorld(1, [], [
      { title: 'F and J', newKeys: ['f', 'j'], length: 20 },
      { title: 'D and K', newKeys: ['d', 'k'], length: 22 },
      { title: 'S and L', newKeys: ['s', 'l'] },
      { title: 'A and ;', newKeys: ['a', ';'] },
      { title: 'G and H', newKeys: ['g', 'h'] },
      { title: 'Home Row Party', newKeys: [], pool: HOME, length: 30 },
    ]),
  },
  {
    id: 2,
    name: 'Cloud Kingdom',
    tagline: 'Reach up to the top row',
    theme: {
      skyTop: '#b9a8ff',
      skyBottom: '#ffe3f4',
      hillFar: '#ffffff',
      hillNear: '#f3eaff',
      ground: '#ffffff',
      groundDark: '#e6dcff',
      groundTop: '#fff7fd',
      block: '#8fd3ff',
      blockDark: '#4aa8e8',
      blockText: '#0f4a78',
      accent: '#a36bff',
      decor: 'clouds',
    },
    levels: buildWorld(2, HOME, [
      { title: 'E and I', newKeys: ['e', 'i'] },
      { title: 'R and U', newKeys: ['r', 'u'] },
      { title: 'T and Y', newKeys: ['t', 'y'] },
      { title: 'W and O', newKeys: ['w', 'o'] },
      { title: 'Q and P', newKeys: ['q', 'p'] },
      { title: 'Top Row Party', newKeys: [], pool: [...TOP, ...HOME], length: 30 },
    ]),
  },
  {
    id: 3,
    name: 'Jellybean Beach',
    tagline: 'Dig down to the bottom row',
    theme: {
      skyTop: '#5ed2e8',
      skyBottom: '#fff3c4',
      hillFar: '#4fc3d9',
      hillNear: '#2fa9c6',
      ground: '#ffe2a1',
      groundDark: '#f2c46b',
      groundTop: '#fff0c9',
      block: '#ff8fb8',
      blockDark: '#e0588b',
      blockText: '#6e0b35',
      accent: '#ff5d8f',
      decor: 'beach',
    },
    levels: buildWorld(3, [...HOME, ...TOP], [
      { title: 'V and M', newKeys: ['v', 'm'] },
      { title: 'C and ,', newKeys: ['c', ','] },
      { title: 'X and .', newKeys: ['x', '.'] },
      { title: 'Z and /', newKeys: ['z', '/'] },
      { title: 'B and N', newKeys: ['b', 'n'] },
      { title: 'Bottom Row Party', newKeys: [], pool: [...BOTTOM, ...HOME], length: 30 },
    ]),
  },
  {
    id: 4,
    name: 'Starlight Castle',
    tagline: 'Use every key you know',
    theme: {
      skyTop: '#1d1b4f',
      skyBottom: '#5b3f9e',
      hillFar: '#3a2f7a',
      hillNear: '#2a2363',
      ground: '#6b5bb8',
      groundDark: '#4d3f94',
      groundTop: '#8f7ee0',
      block: '#ffe066',
      blockDark: '#e0b400',
      blockText: '#5a4200',
      accent: '#ffd23f',
      night: true,
      decor: 'castle',
    },
    levels: buildWorld(4, [...HOME, ...TOP, ...BOTTOM], [
      { title: 'Alphabet Road', newKeys: [], fixed: 'abcdefghijklmnopqrstuvwxyz' },
      { title: 'Pinky Power', newKeys: ['q', 'a', 'z', 'p', ';', '/'], pool: ['q', 'a', 'z', 'p', ';', '/'] },
      { title: 'Pointer Stretch', newKeys: ['t', 'g', 'b', 'y', 'h', 'n'], pool: ['r', 't', 'f', 'g', 'v', 'b', 'y', 'u', 'h', 'j', 'n', 'm'] },
      { title: 'Letter Mix', newKeys: [], pool: LETTERS, length: 30 },
      { title: 'Grand Finale', newKeys: [], pool: [...LETTERS, ';', ',', '.', '/'], length: 36 },
    ]),
  },
];

export const ALL_LEVELS: Level[] = WORLDS.flatMap((w) => w.levels);

export function getLevel(id: string): Level | undefined {
  return ALL_LEVELS.find((l) => l.id === id);
}

export function getWorld(id: number): World {
  const world = WORLDS.find((w) => w.id === id);
  if (!world) throw new Error(`Unknown world ${id}`);
  return world;
}

export function nextLevel(id: string): Level | undefined {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  return i >= 0 ? ALL_LEVELS[i + 1] : undefined;
}
