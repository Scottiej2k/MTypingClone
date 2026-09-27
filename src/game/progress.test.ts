import { describe, expect, it } from 'vitest';
import { ALL_LEVELS, WORLDS } from '../data/lessons';
import {
  accuracyOf,
  currentLevelId,
  defaultProgress,
  isCharacterUnlocked,
  isHatUnlocked,
  isLevelUnlocked,
  isWorldUnlocked,
  recordResult,
  speedOf,
  type Progress,
} from './progress';

const finish = (p: Progress, levelId: string, mistakes = 1) => recordResult(p, { levelId, letters: 20, mistakes, seconds: 30 });

function completeWorld(p: Progress, worldId: number): Progress {
  for (const l of WORLDS.find((w) => w.id === worldId)!.levels) p = finish(p, l.id).progress;
  return p;
}

describe('progress', () => {
  it('starts with only the first level unlocked', () => {
    const p = defaultProgress();
    expect(isLevelUnlocked(p, '1-1')).toBe(true);
    expect(isLevelUnlocked(p, '1-2')).toBe(false);
    expect(isWorldUnlocked(p, 2)).toBe(false);
    expect(currentLevelId(p)).toBe('1-1');
  });

  it('unlocks the next level after finishing one, and reports the party hat', () => {
    const { progress, unlocks } = finish(defaultProgress(), '1-1');
    expect(isLevelUnlocked(progress, '1-2')).toBe(true);
    expect(currentLevelId(progress)).toBe('1-2');
    expect(unlocks).toContainEqual({ type: 'hat', id: 'party' });
  });

  it('unlocks the next world and a new friend after finishing a world', () => {
    let p = defaultProgress();
    const levels = WORLDS[0].levels;
    for (const l of levels.slice(0, -1)) p = finish(p, l.id).progress;
    expect(isCharacterUnlocked(p, 'fig')).toBe(false);
    const { progress, unlocks } = finish(p, levels.at(-1)!.id);
    expect(isWorldUnlocked(progress, 2)).toBe(true);
    expect(isLevelUnlocked(progress, '2-1')).toBe(true);
    expect(unlocks).toContainEqual({ type: 'character', id: 'fig' });
    expect(unlocks).toContainEqual({ type: 'world', id: 2 });
  });

  it('awards the flower crown for a perfect level', () => {
    const { unlocks } = finish(defaultProgress(), '1-1', 0);
    expect(unlocks).toContainEqual({ type: 'hat', id: 'flower' });
  });

  it('keeps best scores and counts plays', () => {
    let p = finish(defaultProgress(), '1-1', 0).progress;
    p = finish(p, '1-1', 10).progress;
    expect(p.completed['1-1']).toEqual({ bestAccuracy: 100, bestLpm: 40, plays: 2 });
  });

  it('does not report an unlock twice', () => {
    const first = finish(defaultProgress(), '1-1');
    const again = finish(first.progress, '1-1');
    expect(again.unlocks).toEqual([]);
  });

  it('unlocks every friend and the crown when the game is finished', () => {
    let p = defaultProgress();
    for (const w of WORLDS) p = completeWorld(p, w.id);
    expect(Object.keys(p.completed)).toHaveLength(ALL_LEVELS.length);
    for (const id of ['pip', 'mochi', 'fig', 'bao', 'sunny', 'luma'] as const) expect(isCharacterUnlocked(p, id)).toBe(true);
    expect(isHatUnlocked(p, 'crown')).toBe(true);
    expect(isHatUnlocked(p, 'wizard')).toBe(true);
  });

  it('computes accuracy and speed', () => {
    expect(accuracyOf({ letters: 20, mistakes: 0 })).toBe(100);
    expect(accuracyOf({ letters: 18, mistakes: 2 })).toBe(90);
    expect(speedOf({ letters: 30, seconds: 60 })).toBe(30);
    expect(speedOf({ letters: 30, seconds: 0 })).toBe(0);
  });
});
