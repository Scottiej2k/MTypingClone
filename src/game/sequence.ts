import type { Level } from '../data/lessons';

export type Rng = () => number;

/** Small deterministic PRNG (mulberry32) so sequences can be reproduced in tests. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds the letters for a level. New keys are weighted to appear more often,
 * every new key is guaranteed to show up, and no key appears three times in a row.
 */
export function generateSequence(level: Level, rng: Rng = Math.random): string[] {
  if (level.fixed) return level.fixed.split('');

  const pool = level.pool;
  const weights = pool.map((k) => (level.newKeys.includes(k) ? 3 : 1));
  const total = weights.reduce((a, b) => a + b, 0);

  const pick = (): string => {
    let r = rng() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r < 0) return pool[i];
    }
    return pool[pool.length - 1];
  };

  const out: string[] = [];
  while (out.length < level.length) {
    let key = pick();
    let guard = 0;
    while (pool.length > 1 && out.length >= 2 && out.at(-1) === key && out.at(-2) === key && guard++ < 20) {
      key = pick();
    }
    out.push(key);
  }

  // Make sure every new key is practised at least twice.
  for (const key of level.newKeys) {
    let count = out.filter((k) => k === key).length;
    let tries = 0;
    while (count < 2 && tries++ < out.length * 4) {
      const i = Math.floor(rng() * out.length);
      const other = out[i];
      const spare = !level.newKeys.includes(other) || out.filter((k) => k === other).length > 2;
      if (other !== key && spare && !wouldTriple(out, i, key)) {
        out[i] = key;
        count++;
      }
    }
  }
  return out;
}

function wouldTriple(seq: string[], i: number, key: string): boolean {
  const at = (j: number) => (j === i ? key : seq[j]);
  for (let start = i - 2; start <= i; start++) {
    if (start < 0 || start + 2 >= seq.length) continue;
    if (at(start) === key && at(start + 1) === key && at(start + 2) === key) return true;
  }
  return false;
}
