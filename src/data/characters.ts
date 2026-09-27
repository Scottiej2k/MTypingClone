export type CharacterId = 'pip' | 'mochi' | 'fig' | 'bao' | 'sunny' | 'luma';
export type HatId = 'none' | 'bow' | 'party' | 'flower' | 'beanie' | 'wizard' | 'crown';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  kind: string;
  blurb: string;
  /** Finishing this world unlocks the character. Null means available from the start. */
  unlockWorld: number | null;
  color: string;
}

export const CHARACTERS: CharacterDef[] = [
  { id: 'pip', name: 'Pip', kind: 'Bunny', blurb: 'Hops super high and loves carrots.', unlockWorld: null, color: '#ffd1dc' },
  { id: 'mochi', name: 'Mochi', kind: 'Kitty', blurb: 'Quick paws and a curious nose.', unlockWorld: null, color: '#ffc58f' },
  { id: 'fig', name: 'Fig', kind: 'Frog', blurb: 'The bounciest friend in the pond.', unlockWorld: 1, color: '#8edc86' },
  { id: 'bao', name: 'Bao', kind: 'Panda', blurb: 'Calm, cuddly, never gives up.', unlockWorld: 2, color: '#d9d9e8' },
  { id: 'sunny', name: 'Sunny', kind: 'Chick', blurb: 'Tiny wings, giant heart.', unlockWorld: 3, color: '#ffe066' },
  { id: 'luma', name: 'Luma', kind: 'Fox', blurb: 'Glows with starlight courage.', unlockWorld: 4, color: '#ff9a52' },
];

export interface HatDef {
  id: HatId;
  name: string;
  /** Shown on locked hats so kids know how to earn them. */
  hint: string;
}

export const HATS: HatDef[] = [
  { id: 'none', name: 'No hat', hint: '' },
  { id: 'bow', name: 'Pink Bow', hint: '' },
  { id: 'party', name: 'Party Hat', hint: 'Finish your first level' },
  { id: 'flower', name: 'Flower Crown', hint: 'Finish a level with no oopses' },
  { id: 'beanie', name: 'Cozy Beanie', hint: 'Type 500 letters' },
  { id: 'wizard', name: 'Wizard Hat', hint: 'Finish 10 levels' },
  { id: 'crown', name: 'Royal Crown', hint: 'Finish Starlight Castle' },
];

export function getCharacter(id: string): CharacterDef {
  return CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0];
}

const INK = '#3b2f4a';
const CHEEK = '#ff8fab';

interface Look {
  body: string;
  belly: string;
  /** Head shape: circle radius or ellipse radii. */
  head: { rx: number; ry: number; cy: number };
  eyes: [number, number][];
  hatY: number;
  behind: string;
  front: string;
  mouth: string;
  pandaEyes?: boolean;
}

function looks(id: CharacterId): Look {
  const smile = `<path d="M54 71 Q57 74.5 60 71 Q63 74.5 66 71" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`;
  const stdHead = { rx: 34, ry: 32, cy: 58 };
  const stdEyes: [number, number][] = [
    [47, 60],
    [73, 60],
  ];
  switch (id) {
    case 'pip':
      return {
        body: '#fffaf3',
        belly: '#ffe8ee',
        head: stdHead,
        eyes: stdEyes,
        hatY: 30,
        behind: `
          <g stroke="${INK}" stroke-width="3">
            <ellipse cx="45" cy="14" rx="10" ry="25" fill="#fffaf3" transform="rotate(-10 45 30)"/>
            <ellipse cx="75" cy="14" rx="10" ry="25" fill="#fffaf3" transform="rotate(12 75 30)"/>
          </g>
          <ellipse cx="45" cy="16" rx="4.5" ry="17" fill="#ffc2d4" transform="rotate(-10 45 30)"/>
          <ellipse cx="75" cy="16" rx="4.5" ry="17" fill="#ffc2d4" transform="rotate(12 75 30)"/>`,
        front: `<ellipse cx="60" cy="66.5" rx="3" ry="2.2" fill="#ff7aa2"/>`,
        mouth: smile,
      };
    case 'mochi':
      return {
        body: '#ffc58f',
        belly: '#fff1e0',
        head: stdHead,
        eyes: stdEyes,
        hatY: 30,
        behind: `
          <path d="M96 108 Q116 96 106 78" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
          <path d="M96 108 Q116 96 106 78" fill="none" stroke="#ffc58f" stroke-width="6" stroke-linecap="round"/>
          <g stroke="${INK}" stroke-width="3" stroke-linejoin="round" fill="#ffc58f">
            <path d="M28 44 L32 10 L56 30 Z"/>
            <path d="M92 44 L88 10 L64 30 Z"/>
          </g>
          <path d="M34 36 L35.5 19 L48 30 Z" fill="#ffb3c6"/>
          <path d="M86 36 L84.5 19 L72 30 Z" fill="#ffb3c6"/>`,
        front: `
          <g stroke="#e8964f" stroke-width="3" stroke-linecap="round">
            <path d="M60 28 L60 36"/><path d="M52 30 L53 36"/><path d="M68 30 L67 36"/>
          </g>
          <g stroke="${INK}" stroke-width="1.6" stroke-linecap="round" opacity=".7">
            <path d="M30 66 L16 63"/><path d="M30 70 L16 72"/>
            <path d="M90 66 L104 63"/><path d="M90 70 L104 72"/>
          </g>
          <path d="M57 66 L63 66 L60 69 Z" fill="#ff7aa2"/>`,
        mouth: smile,
      };
    case 'fig':
      return {
        body: '#8edc86',
        belly: '#e9ffd9',
        head: { rx: 38, ry: 29, cy: 62 },
        eyes: [
          [42, 32],
          [78, 32],
        ],
        hatY: 36,
        behind: `
          <g stroke="${INK}" stroke-width="3" fill="#8edc86">
            <circle cx="42" cy="32" r="14"/>
            <circle cx="78" cy="32" r="14"/>
          </g>
          <circle cx="42" cy="32" r="9" fill="#fff"/>
          <circle cx="78" cy="32" r="9" fill="#fff"/>`,
        front: `<g fill="#6cc466"><circle cx="40" cy="54" r="3"/><circle cx="82" cy="52" r="2.5"/><circle cx="76" cy="46" r="2"/></g>`,
        mouth: `<path d="M44 70 Q60 84 76 70" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
      };
    case 'bao':
      return {
        body: '#4a4760',
        belly: '#ffffff',
        head: stdHead,
        eyes: stdEyes,
        hatY: 30,
        pandaEyes: true,
        behind: `
          <g stroke="${INK}" stroke-width="3" fill="#4a4760">
            <circle cx="33" cy="32" r="12"/>
            <circle cx="87" cy="32" r="12"/>
          </g>`,
        front: `
          <ellipse cx="46" cy="61" rx="9" ry="11.5" fill="#4a4760" transform="rotate(25 46 61)"/>
          <ellipse cx="74" cy="61" rx="9" ry="11.5" fill="#4a4760" transform="rotate(-25 74 61)"/>
          <ellipse cx="60" cy="67" rx="3.6" ry="2.6" fill="${INK}"/>`,
        mouth: smile,
      };
    case 'sunny':
      return {
        body: '#ffe066',
        belly: '#fff6c2',
        head: stdHead,
        eyes: stdEyes,
        hatY: 30,
        behind: `
          <path d="M56 28 Q50 10 60 16 Q64 4 68 20" fill="#ffe066" stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`,
        front: `<path d="M52 67 L60 62 L68 67 L60 74 Z" fill="#ff9f40" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`,
        mouth: '',
      };
    case 'luma':
      return {
        body: '#ff9a52',
        belly: '#fff4e8',
        head: stdHead,
        eyes: stdEyes,
        hatY: 30,
        behind: `
          <path d="M92 110 Q124 104 112 70 Q104 88 90 94 Z" fill="#ff9a52" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
          <path d="M112 70 Q116 80 110 88 Q104 82 106 76 Z" fill="#fff4e8"/>
          <g stroke="${INK}" stroke-width="3" stroke-linejoin="round" fill="#ff9a52">
            <path d="M28 46 L30 4 L58 30 Z"/>
            <path d="M92 46 L90 4 L62 30 Z"/>
          </g>
          <path d="M30 4 L31 18 L40 14 Z" fill="#5a3a2e"/>
          <path d="M90 4 L89 18 L80 14 Z" fill="#5a3a2e"/>`,
        front: `
          <path d="M27 64 Q44 64 60 76 Q76 64 93 64 Q86 90 60 90 Q34 90 27 64 Z" fill="#fff4e8"/>
          <ellipse cx="60" cy="72" rx="3.6" ry="2.6" fill="${INK}"/>`,
        mouth: `<path d="M55 77 Q57.5 80 60 77 Q62.5 80 65 77" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`,
      };
  }
}

function hatSvg(hat: HatId, y: number): string {
  switch (hat) {
    case 'none':
      return '';
    case 'bow':
      return `
        <g transform="translate(80 ${y + 6}) rotate(18)" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
          <path d="M0 0 L-16 -9 L-16 9 Z" fill="#ff7aa2"/>
          <path d="M0 0 L16 -9 L16 9 Z" fill="#ff7aa2"/>
          <circle r="4.5" fill="#ff5d8f"/>
        </g>`;
    case 'party':
      return `
        <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
          <path d="M46 ${y + 2} L60 ${y - 30} L74 ${y + 2} Z" fill="#7fd3ff"/>
          <path d="M50 ${y - 6} L70 ${y - 6}" stroke="#ff7aa2" stroke-width="4"/>
          <path d="M54.5 ${y - 16} L65.5 ${y - 16}" stroke="#ffe066" stroke-width="4"/>
          <circle cx="60" cy="${y - 32}" r="5" fill="#ff7aa2"/>
        </g>`;
    case 'flower': {
      const flower = (x: number, fy: number, c: string) => `
        <g transform="translate(${x} ${fy})">
          ${[0, 72, 144, 216, 288].map((a) => `<circle cx="${Math.cos((a * Math.PI) / 180) * 5}" cy="${Math.sin((a * Math.PI) / 180) * 5}" r="4" fill="${c}"/>`).join('')}
          <circle r="3" fill="#ffe066"/>
        </g>`;
      return `
        <path d="M34 ${y + 8} Q60 ${y - 8} 86 ${y + 8}" fill="none" stroke="#5cbf60" stroke-width="4" stroke-linecap="round"/>
        ${flower(38, y + 5, '#ff8fb8')}${flower(60, y - 1, '#b9a8ff')}${flower(82, y + 5, '#ffb347')}`;
    }
    case 'beanie':
      return `
        <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
          <path d="M32 ${y + 10} Q34 ${y - 22} 60 ${y - 22} Q86 ${y - 22} 88 ${y + 10} Z" fill="#6fb8ff"/>
          <rect x="30" y="${y + 2}" width="60" height="11" rx="5.5" fill="#3d8be0"/>
          <circle cx="60" cy="${y - 25}" r="7" fill="#fff"/>
        </g>`;
    case 'wizard':
      return `
        <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
          <ellipse cx="60" cy="${y + 4}" rx="30" ry="7" fill="#7a5cff"/>
          <path d="M44 ${y + 3} Q52 ${y - 20} 58 ${y - 40} Q64 ${y - 30} 76 ${y + 3} Z" fill="#8f73ff"/>
          <path d="M62 ${y - 14} l2 4.5 5 .5 -3.8 3.3 1.2 4.9 -4.4 -2.6 -4.4 2.6 1.2 -4.9 -3.8 -3.3 5 -.5 Z" fill="#ffe066" stroke-width="1.2"/>
        </g>`;
    case 'crown':
      return `
        <g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
          <path d="M42 ${y + 4} L40 ${y - 16} L51 ${y - 6} L60 ${y - 22} L69 ${y - 6} L80 ${y - 16} L78 ${y + 4} Z" fill="#ffd23f"/>
          <circle cx="60" cy="${y - 4}" r="3.5" fill="#ff5d8f" stroke-width="1.5"/>
          <circle cx="49" cy="${y - 1}" r="2.5" fill="#6fd3ff" stroke-width="1.5"/>
          <circle cx="71" cy="${y - 1}" r="2.5" fill="#6fd3ff" stroke-width="1.5"/>
        </g>`;
  }
}

/** Returns inline SVG markup for a character, optionally wearing a hat. */
export function characterSvg(id: CharacterId, hat: HatId = 'none', opts: { silhouette?: boolean } = {}): string {
  const l = looks(id);
  const eyes = l.eyes
    .map(([x, y]) =>
      l.pandaEyes
        ? `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="5.4" fill="#fff"/><ellipse cx="${x}" cy="${y + 0.5}" rx="3" ry="3.8" fill="${INK}"/><circle cx="${x + 1}" cy="${y - 1.5}" r="1.2" fill="#fff"/>`
        : `<ellipse cx="${x}" cy="${y}" rx="5" ry="6.4" fill="${INK}"/><circle cx="${x + 1.8}" cy="${y - 2.4}" r="2" fill="#fff"/>`,
    )
    .join('');
  const armColor = id === 'bao' ? '#4a4760' : l.body;
  const headColor = id === 'bao' ? '#ffffff' : l.body;
  const svg = `
  <svg class="critter" viewBox="0 -12 120 144" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g class="critter-body">
      ${l.behind}
      <g stroke="${INK}" stroke-width="3">
        <ellipse cx="46" cy="124" rx="11" ry="6.5" fill="${armColor}"/>
        <ellipse cx="74" cy="124" rx="11" ry="6.5" fill="${armColor}"/>
        <ellipse cx="60" cy="103" rx="27" ry="22" fill="${id === 'bao' ? '#ffffff' : l.body}"/>
      </g>
      <ellipse cx="60" cy="107" rx="16" ry="13" fill="${l.belly}"/>
      <g stroke="${INK}" stroke-width="3" fill="${armColor}">
        <ellipse class="arm arm-l" cx="35" cy="100" rx="7.5" ry="11" transform="rotate(25 35 100)"/>
        <ellipse class="arm arm-r" cx="85" cy="100" rx="7.5" ry="11" transform="rotate(-25 85 100)"/>
      </g>
      <ellipse cx="60" cy="${l.head.cy}" rx="${l.head.rx}" ry="${l.head.ry}" fill="${headColor}" stroke="${INK}" stroke-width="3"/>
      ${l.front}
      <g class="eyes">${eyes}</g>
      <ellipse cx="${l.eyes[0][0] - 9}" cy="${Math.max(l.eyes[0][1] + 11, 70)}" rx="6" ry="3.6" fill="${CHEEK}" opacity=".55"/>
      <ellipse cx="${l.eyes[1][0] + 9}" cy="${Math.max(l.eyes[1][1] + 11, 70)}" rx="6" ry="3.6" fill="${CHEEK}" opacity=".55"/>
      ${l.mouth}
      ${hatSvg(hat, l.hatY)}
    </g>
  </svg>`;
  return opts.silhouette ? svg.replace('class="critter"', 'class="critter silhouette"') : svg;
}
