import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, getLevel } from '../data/lessons';
import { generateSequence, seededRng } from './sequence';

describe('generateSequence', () => {
  it('produces the requested number of keys, all from the pool', () => {
    for (const level of ALL_LEVELS) {
      const seq = generateSequence(level, seededRng(42));
      expect(seq).toHaveLength(level.length);
      for (const key of seq) expect(level.pool).toContain(key);
    }
  });

  it('never repeats a key three times in a row', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const level of ALL_LEVELS) {
        const seq = generateSequence(level, seededRng(seed));
        for (let i = 2; i < seq.length; i++) {
          expect(seq[i] === seq[i - 1] && seq[i] === seq[i - 2], `${level.id} seed ${seed}: ${seq.join('')}`).toBe(false);
        }
      }
    }
  });

  it('practises every new key at least twice', () => {
    for (let seed = 0; seed < 100; seed++) {
      for (const level of ALL_LEVELS.filter((l) => !l.fixed)) {
        const seq = generateSequence(level, seededRng(seed));
        for (const key of level.newKeys) {
          expect(seq.filter((k) => k === key).length, `${level.id} ${key}`).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('uses the fixed sequence for the alphabet level', () => {
    expect(generateSequence(getLevel('4-1')!).join('')).toBe('abcdefghijklmnopqrstuvwxyz');
  });

  it('is deterministic for a given seed', () => {
    const level = getLevel('1-3')!;
    expect(generateSequence(level, seededRng(7))).toEqual(generateSequence(level, seededRng(7)));
  });
});

describe('lessons', () => {
  it('introduces every letter of the alphabet by the end', () => {
    const introduced = new Set(ALL_LEVELS.flatMap((l) => l.pool));
    for (const ch of 'abcdefghijklmnopqrstuvwxyz') expect(introduced).toContain(ch);
  });

  it('only uses keys that were introduced in the same or an earlier world', () => {
    const seen = new Set<string>();
    let world = 0;
    let worldKeys = new Set<string>();
    for (const level of ALL_LEVELS) {
      if (level.world !== world) {
        worldKeys.forEach((k) => seen.add(k));
        worldKeys = new Set();
        world = level.world;
      }
      level.newKeys.forEach((k) => worldKeys.add(k));
      const known = new Set([...seen, ...worldKeys]);
      for (const k of level.pool) expect(known.has(k), `${level.id} uses ${k} before it is taught`).toBe(true);
    }
  });
});
