import { ALL_LEVELS, WORLDS } from '../data/lessons';
import { CHARACTERS, HATS, type CharacterId, type HatId } from '../data/characters';

export interface LevelRecord {
  bestAccuracy: number;
  bestLpm: number;
  plays: number;
}

export interface Settings {
  music: boolean;
  sfx: boolean;
  fingerHelper: boolean;
  fingerColors: boolean;
}

export interface Progress {
  version: 1;
  completed: Record<string, LevelRecord>;
  character: CharacterId;
  hat: HatId;
  totalLetters: number;
  perfectLevels: number;
  settings: Settings;
}

export interface LevelResult {
  levelId: string;
  letters: number;
  mistakes: number;
  seconds: number;
}

export type Unlock = { type: 'character'; id: CharacterId } | { type: 'hat'; id: HatId } | { type: 'world'; id: number };

const STORAGE_KEY = 'pip-typing-adventure-v1';

export function defaultProgress(): Progress {
  return {
    version: 1,
    completed: {},
    character: 'pip',
    hat: 'none',
    totalLetters: 0,
    perfectLevels: 0,
    settings: { music: true, sfx: true, fingerHelper: true, fingerColors: true },
  };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Progress>;
    const base = defaultProgress();
    return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // Storage can be unavailable (private mode); the game still works for this session.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isLevelComplete(p: Progress, levelId: string): boolean {
  return levelId in p.completed;
}

export function isWorldComplete(p: Progress, worldId: number): boolean {
  const world = WORLDS.find((w) => w.id === worldId);
  return !!world && world.levels.every((l) => isLevelComplete(p, l.id));
}

export function isWorldUnlocked(p: Progress, worldId: number): boolean {
  return worldId === 1 || isWorldComplete(p, worldId - 1);
}

/** Levels unlock one at a time: the first of each unlocked world, then each after a completed one. */
export function isLevelUnlocked(p: Progress, levelId: string): boolean {
  const i = ALL_LEVELS.findIndex((l) => l.id === levelId);
  if (i < 0) return false;
  const level = ALL_LEVELS[i];
  if (!isWorldUnlocked(p, level.world)) return false;
  if (level.index === 0) return true;
  return isLevelComplete(p, ALL_LEVELS[i - 1].id);
}

export function isCharacterUnlocked(p: Progress, id: CharacterId): boolean {
  const c = CHARACTERS.find((ch) => ch.id === id);
  if (!c) return false;
  return c.unlockWorld === null || isWorldComplete(p, c.unlockWorld);
}

export function isHatUnlocked(p: Progress, id: HatId): boolean {
  const done = Object.keys(p.completed).length;
  switch (id) {
    case 'none':
    case 'bow':
      return true;
    case 'party':
      return done >= 1;
    case 'flower':
      return p.perfectLevels >= 1;
    case 'beanie':
      return p.totalLetters >= 500;
    case 'wizard':
      return done >= 10;
    case 'crown':
      return isWorldComplete(p, WORLDS[WORLDS.length - 1].id);
  }
}

/** The first unlocked level the player hasn't finished yet (or the last level if all are done). */
export function currentLevelId(p: Progress): string {
  const next = ALL_LEVELS.find((l) => isLevelUnlocked(p, l.id) && !isLevelComplete(p, l.id));
  return (next ?? ALL_LEVELS[ALL_LEVELS.length - 1]).id;
}

export function accuracyOf(r: Pick<LevelResult, 'letters' | 'mistakes'>): number {
  const presses = r.letters + r.mistakes;
  return presses === 0 ? 100 : Math.round((r.letters / presses) * 100);
}

/** Letters per minute. */
export function speedOf(r: Pick<LevelResult, 'letters' | 'seconds'>): number {
  return r.seconds <= 0 ? 0 : Math.round((r.letters / r.seconds) * 60);
}

function unlockSnapshot(p: Progress): Set<string> {
  const s = new Set<string>();
  for (const c of CHARACTERS) if (isCharacterUnlocked(p, c.id)) s.add(`character:${c.id}`);
  for (const h of HATS) if (isHatUnlocked(p, h.id)) s.add(`hat:${h.id}`);
  for (const w of WORLDS) if (isWorldUnlocked(p, w.id)) s.add(`world:${w.id}`);
  return s;
}

/** Applies a finished level to progress (immutably) and reports anything newly unlocked. */
export function recordResult(p: Progress, result: LevelResult): { progress: Progress; unlocks: Unlock[] } {
  const before = unlockSnapshot(p);
  const accuracy = accuracyOf(result);
  const lpm = speedOf(result);
  const prev = p.completed[result.levelId];
  const next: Progress = {
    ...p,
    completed: {
      ...p.completed,
      [result.levelId]: {
        bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy),
        bestLpm: Math.max(prev?.bestLpm ?? 0, lpm),
        plays: (prev?.plays ?? 0) + 1,
      },
    },
    totalLetters: p.totalLetters + result.letters,
    perfectLevels: p.perfectLevels + (result.mistakes === 0 ? 1 : 0),
  };
  const after = unlockSnapshot(next);
  const unlocks: Unlock[] = [];
  for (const key of after) {
    if (before.has(key)) continue;
    const [type, id] = key.split(':');
    if (type === 'character') unlocks.push({ type, id: id as CharacterId });
    else if (type === 'hat') unlocks.push({ type, id: id as HatId });
    else unlocks.push({ type: 'world', id: Number(id) });
  }
  return { progress: next, unlocks };
}
