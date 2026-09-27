import { describe, expect, it } from 'vitest';
import { fingerFor, normaliseKey } from './keyboard';

describe('keyboard helpers', () => {
  it('maps keys to the right finger', () => {
    expect(fingerFor('f')).toBe('L-index');
    expect(fingerFor('g')).toBe('L-index');
    expect(fingerFor('h')).toBe('R-index');
    expect(fingerFor('a')).toBe('L-pinky');
    expect(fingerFor(';')).toBe('R-pinky');
    expect(fingerFor('/')).toBe('R-pinky');
    expect(fingerFor(' ')).toBe('thumb');
  });

  it('normalises key events', () => {
    expect(normaliseKey('F')).toBe('f');
    expect(normaliseKey(':')).toBe(';');
    expect(normaliseKey('?')).toBe('/');
    expect(normaliseKey(' ')).toBe(' ');
    expect(normaliseKey('Shift')).toBeNull();
    expect(normaliseKey('ArrowLeft')).toBeNull();
  });
});
