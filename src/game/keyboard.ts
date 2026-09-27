export type Finger =
  | 'L-pinky'
  | 'L-ring'
  | 'L-middle'
  | 'L-index'
  | 'thumb'
  | 'R-index'
  | 'R-middle'
  | 'R-ring'
  | 'R-pinky';

/** Letter rows of a QWERTY keyboard, top to bottom. */
export const KEY_ROWS: string[][] = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
];

/** How far (in key widths) each row is shifted right, like a real keyboard. */
export const ROW_OFFSETS = [0.5, 0.75, 1.25];

const FINGER_BY_COLUMN: Finger[] = [
  'L-pinky',
  'L-ring',
  'L-middle',
  'L-index',
  'L-index',
  'R-index',
  'R-index',
  'R-middle',
  'R-ring',
  'R-pinky',
];

export function fingerFor(key: string): Finger {
  if (key === ' ') return 'thumb';
  for (const row of KEY_ROWS) {
    const col = row.indexOf(key);
    if (col >= 0) return FINGER_BY_COLUMN[col];
  }
  return 'thumb';
}

export const FINGER_NAMES: Record<Finger, string> = {
  'L-pinky': 'left pinky',
  'L-ring': 'left ring finger',
  'L-middle': 'left middle finger',
  'L-index': 'left pointer finger',
  thumb: 'thumb',
  'R-index': 'right pointer finger',
  'R-middle': 'right middle finger',
  'R-ring': 'right ring finger',
  'R-pinky': 'right pinky',
};

/** The home-row key each finger rests on. */
export const HOME_KEY: Record<Finger, string> = {
  'L-pinky': 'a',
  'L-ring': 's',
  'L-middle': 'd',
  'L-index': 'f',
  thumb: ' ',
  'R-index': 'j',
  'R-middle': 'k',
  'R-ring': 'l',
  'R-pinky': ';',
};

/** Friendly on-screen label for a key. */
export function keyLabel(key: string): string {
  if (key === ' ') return 'Space';
  return key.toUpperCase();
}

/**
 * Normalises a KeyboardEvent.key into the character we compare against,
 * or null if it is a key we should ignore (Shift, arrows, F-keys, ...).
 */
export function normaliseKey(eventKey: string): string | null {
  if (eventKey === ' ' || eventKey === 'Spacebar') return ' ';
  if (eventKey.length !== 1) return null;
  const lower = eventKey.toLowerCase();
  // Shifted punctuation still means the same physical key for our purposes.
  const unshift: Record<string, string> = { ':': ';', '<': ',', '>': '.', '?': '/' };
  return unshift[lower] ?? lower;
}
