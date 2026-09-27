import { KEY_ROWS, ROW_OFFSETS, fingerFor, keyLabel, type Finger } from '../game/keyboard';
import { h } from './dom';

export const FINGER_COLORS: Record<Finger, string> = {
  'L-pinky': '#ff9ec7',
  'L-ring': '#ffb86b',
  'L-middle': '#ffe066',
  'L-index': '#7ee0a1',
  thumb: '#c7b8ff',
  'R-index': '#7fc8ff',
  'R-middle': '#ffe066',
  'R-ring': '#ffb86b',
  'R-pinky': '#ff9ec7',
};

/** On-screen keyboard that highlights the key to press and flashes wrong presses. */
export class KeyboardView {
  readonly el: HTMLElement;
  private keys = new Map<string, HTMLElement>();
  private target: string | null = null;

  constructor(onTap: (key: string) => void) {
    this.el = h('div', { class: 'kbd', role: 'group', 'aria-label': 'Keyboard' });
    KEY_ROWS.forEach((row, r) => {
      const rowEl = h('div', { class: 'kbd-row' });
      rowEl.style.setProperty('--offset', String(ROW_OFFSETS[r]));
      for (const key of row) {
        const finger = fingerFor(key);
        const keyEl = h(
          'button',
          {
            class: `key${key === 'f' || key === 'j' ? ' bump' : ''}`,
            type: 'button',
            tabindex: -1,
            'data-key': key,
            'aria-label': keyLabel(key),
            onclick: () => onTap(key),
          },
          h('span', { class: 'key-cap' }, keyLabel(key)),
        );
        keyEl.style.setProperty('--finger', FINGER_COLORS[finger]);
        this.keys.set(key, keyEl);
        rowEl.append(keyEl);
      }
      this.el.append(rowEl);
    });
    const space = h('button', { class: 'key space', type: 'button', tabindex: -1, 'data-key': ' ', onclick: () => onTap(' ') }, h('span', { class: 'key-cap' }, 'space'));
    space.style.setProperty('--finger', FINGER_COLORS.thumb);
    this.keys.set(' ', space);
    this.el.append(h('div', { class: 'kbd-row space-row' }, space));
  }

  setFingerColors(on: boolean): void {
    this.el.classList.toggle('no-colors', !on);
  }

  setTarget(key: string | null): void {
    if (this.target) this.keys.get(this.target)?.classList.remove('target');
    this.target = key;
    if (key) this.keys.get(key)?.classList.add('target');
  }

  flash(key: string, kind: 'right' | 'wrong'): void {
    const el = this.keys.get(key);
    if (!el) return;
    el.classList.remove('right', 'wrong');
    void el.offsetWidth; // restart the animation
    el.classList.add(kind);
    window.setTimeout(() => el.classList.remove(kind), kind === 'wrong' ? 700 : 300);
  }
}

/** Two little hands that light up the finger to use. */
export class HandsView {
  readonly left: SVGSVGElement;
  readonly right: SVGSVGElement;
  private fingers = new Map<Finger, SVGElement[]>();

  constructor() {
    const holder = document.createElement('div');
    holder.innerHTML = `${this.hand('L')}${this.hand('R')}`;
    holder.querySelectorAll<SVGElement>('[data-finger]').forEach((f) => {
      const id = f.dataset.finger as Finger;
      f.style.setProperty('--finger', FINGER_COLORS[id]);
      this.fingers.set(id, [...(this.fingers.get(id) ?? []), f]);
    });
    [this.left, this.right] = [...holder.querySelectorAll('svg')] as SVGSVGElement[];
  }

  private hand(side: 'L' | 'R'): string {
    // Left hand from left to right: pinky, ring, middle, pointer, thumb.
    const parts: { id: Finger; x: number; y: number; w: number; hgt: number; rot?: number }[] = [
      { id: `${side}-pinky` as Finger, x: 14, y: 40, w: 17, hgt: 44 },
      { id: `${side}-ring` as Finger, x: 34, y: 20, w: 18, hgt: 60 },
      { id: `${side}-middle` as Finger, x: 55, y: 12, w: 18, hgt: 66 },
      { id: `${side}-index` as Finger, x: 76, y: 22, w: 18, hgt: 58 },
      { id: 'thumb', x: 96, y: 72, w: 18, hgt: 42, rot: 38 },
    ];
    const mirror = (x: number, w: number) => (side === 'L' ? x : 128 - x - w);
    const fingers = parts
      .map((p) => {
        const x = mirror(p.x, p.w);
        const rot = p.rot ? (side === 'L' ? p.rot : -p.rot) : 0;
        const cx = x + p.w / 2;
        return `<rect class="finger" data-finger="${p.id}" x="${x}" y="${p.y}" width="${p.w}" height="${p.hgt}" rx="${p.w / 2}" transform="rotate(${rot} ${cx} ${p.y + p.hgt})"/>`;
      })
      .join('');
    const palmX = side === 'L' ? 12 : 22;
    return `<svg class="hand hand-${side}" viewBox="0 0 128 150" aria-hidden="true">${fingers}<rect class="palm" x="${palmX}" y="62" width="94" height="58" rx="26"/><text class="hand-label" x="64" y="143" text-anchor="middle">${side === 'L' ? 'left hand' : 'right hand'}</text></svg>`;
  }

  setFinger(finger: Finger | null): void {
    for (const f of this.fingers.values()) f.forEach((el) => el.classList.remove('on'));
    if (finger) this.fingers.get(finger)?.forEach((f) => f.classList.add('on'));
  }

  /** Wiggles the hand that should be used, to draw attention after repeated misses. */
  nudge(finger: Finger): void {
    const hands = finger === 'thumb' ? [this.left, this.right] : [finger.startsWith('L') ? this.left : this.right];
    for (const hand of hands) {
      hand.classList.remove('nudge');
      void hand.getBoundingClientRect();
      hand.classList.add('nudge');
    }
  }
}
