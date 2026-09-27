import type { WorldTheme } from '../data/lessons';

/** Builds tileable SVG backgrounds (as data URIs) for each parallax layer of a world. */

const uri = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' '))}")`;

function hills(color: string, height: number, bumps: number[], width = 800): string {
  // Smooth rolling hills that tile seamlessly: start and end at the same height.
  const step = width / bumps.length;
  let d = `M0 ${height} L0 ${bumps[0]}`;
  bumps.forEach((y, i) => {
    const nextY = bumps[(i + 1) % bumps.length];
    const x0 = i * step;
    d += ` C${x0 + step * 0.35} ${y - 30} ${x0 + step * 0.65} ${nextY - 30} ${x0 + step} ${nextY}`;
  });
  d += ` L${width} ${height} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${d}" fill="${color}"/></svg>`;
}

function cloud(x: number, y: number, s: number, fill: string): string {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}"><circle cx="0" cy="10" r="16"/><circle cx="20" cy="0" r="22"/><circle cx="44" cy="8" r="18"/><rect x="-10" y="8" width="66" height="18" rx="9"/></g>`;
}

function decorLayer(t: WorldTheme): string {
  const w = 900;
  const hgt = 220;
  let items = '';
  switch (t.decor) {
    case 'meadow':
      for (const [x, s] of [[80, 1], [360, 0.8], [640, 1.1]] as const) {
        items += `<g transform="translate(${x} ${hgt - 10}) scale(${s})"><rect x="-7" y="-70" width="14" height="70" rx="6" fill="#a0673d"/><circle cx="0" cy="-86" r="36" fill="#5cbf60"/><circle cx="-22" cy="-70" r="24" fill="#6fd06e"/><circle cx="24" cy="-72" r="22" fill="#4fb35a"/><circle cx="10" cy="-96" r="5" fill="#ff7a7a"/><circle cx="-14" cy="-80" r="5" fill="#ff7a7a"/></g>`;
      }
      for (const x of [200, 250, 480, 520, 760, 820]) {
        items += `<g transform="translate(${x} ${hgt - 4})"><path d="M0 0 L0 -18" stroke="#3f9d4a" stroke-width="3"/><circle cy="-22" r="6" fill="${x % 3 ? '#fff' : '#ffd23f'}"/><circle cy="-22" r="2.5" fill="#ffb347"/></g>`;
      }
      break;
    case 'clouds':
      items += `<g opacity=".55" transform="translate(600 ${hgt - 150})"><path d="M-160 150 A160 160 0 0 1 160 150" fill="none" stroke="#ff9ec7" stroke-width="16"/><path d="M-144 150 A144 144 0 0 1 144 150" fill="none" stroke="#ffe066" stroke-width="16"/><path d="M-128 150 A128 128 0 0 1 128 150" fill="none" stroke="#8fe0a8" stroke-width="16"/><path d="M-112 150 A112 112 0 0 1 112 150" fill="none" stroke="#8fd3ff" stroke-width="16"/></g>`;
      items += cloud(60, hgt - 60, 1.4, '#ffffff') + cloud(300, hgt - 90, 1, '#fff5fc') + cloud(760, hgt - 70, 1.2, '#ffffff');
      break;
    case 'beach':
      for (const [x, s] of [[120, 1], [560, 1.2]] as const) {
        items += `<g transform="translate(${x} ${hgt}) scale(${s})"><path d="M0 0 Q8 -60 -4 -120" stroke="#b07a4a" stroke-width="12" fill="none" stroke-linecap="round"/><g fill="#3fbf7f"><path d="M-4 -120 Q-50 -140 -70 -100 Q-40 -120 -4 -116Z"/><path d="M-4 -120 Q40 -150 70 -106 Q34 -126 -4 -116Z"/><path d="M-4 -122 Q-20 -170 -54 -160 Q-24 -150 -6 -118Z"/><path d="M-4 -122 Q20 -170 50 -164 Q20 -150 -2 -118Z"/></g><circle cx="-10" cy="-112" r="6" fill="#8a5a2b"/><circle cx="4" cy="-110" r="6" fill="#8a5a2b"/></g>`;
      }
      for (const [x, c] of [[330, '#ff8fb8'], [360, '#8fd3ff'], [800, '#ffe066'], [700, '#b9a8ff']] as const) {
        items += `<ellipse cx="${x}" cy="${hgt - 6}" rx="10" ry="6" fill="${c}"/>`;
      }
      break;
    case 'castle':
      items += `<g transform="translate(560 ${hgt})" fill="#2a2363"><rect x="-90" y="-120" width="180" height="120"/><rect x="-120" y="-170" width="50" height="170"/><rect x="70" y="-170" width="50" height="170"/><rect x="-25" y="-200" width="50" height="80"/><path d="M-125 -170 L-95 -215 L-65 -170Z M65 -170 L95 -215 L125 -170Z M-30 -200 L0 -250 L30 -200Z"/><g fill="#ffe066" opacity=".85"><rect x="-105" y="-140" width="16" height="22" rx="8"/><rect x="89" y="-140" width="16" height="22" rx="8"/><rect x="-8" y="-180" width="16" height="22" rx="8"/><rect x="-50" y="-80" width="18" height="26" rx="9"/><rect x="32" y="-80" width="18" height="26" rx="9"/></g></g>`;
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">${items}</svg>`;
}

function skyLayer(t: WorldTheme): string {
  const w = 1200;
  const hgt = 400;
  let items = '';
  if (t.night) {
    const pts = [[60, 40], [180, 110], [260, 30], [420, 80], [520, 150], [640, 50], [760, 120], [880, 30], [990, 90], [1120, 60], [340, 190], [1060, 180]];
    for (const [x, y] of pts) items += `<circle cx="${x}" cy="${y}" r="${(x % 3) + 1.5}" fill="#fff8d6" opacity=".9"/>`;
    items += `<circle cx="900" cy="90" r="46" fill="#fff4c2"/><circle cx="886" cy="100" r="7" fill="#f2e3a0"/><circle cx="912" cy="72" r="5" fill="#f2e3a0"/>`;
  } else {
    items += cloud(80, 80, 1, 'rgba(255,255,255,.9)') + cloud(520, 50, 0.7, 'rgba(255,255,255,.8)') + cloud(900, 120, 1.1, 'rgba(255,255,255,.85)');
    if (t.decor === 'beach' || t.decor === 'meadow') items += `<circle cx="1080" cy="70" r="40" fill="#ffe066"/><circle cx="1080" cy="70" r="54" fill="#ffe066" opacity=".3"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}">${items}</svg>`;
}

function groundTile(t: WorldTheme): string {
  const w = 120;
  const hgt = 200;
  const pebbles = t.decor === 'clouds' ? '' : `<circle cx="30" cy="60" r="5" fill="${t.groundDark}"/><circle cx="90" cy="100" r="7" fill="${t.groundDark}"/><circle cx="60" cy="150" r="4" fill="${t.groundDark}"/>`;
  const top =
    t.decor === 'clouds'
      ? `<path d="M0 22 Q15 0 30 14 Q45 0 60 14 Q75 0 90 14 Q105 0 120 22 L120 30 L0 30Z" fill="${t.groundTop}"/>`
      : `<path d="M0 0 H120 V20 Q105 30 90 20 Q75 30 60 20 Q45 30 30 20 Q15 30 0 20Z" fill="${t.groundTop}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}"><rect width="${w}" height="${hgt}" fill="${t.ground}"/>${pebbles}${top}</svg>`;
}

export interface SceneryImages {
  sky: string;
  far: string;
  near: string;
  decor: string;
  ground: string;
}

export function sceneryFor(t: WorldTheme): SceneryImages {
  return {
    sky: uri(skyLayer(t)),
    far: uri(hills(t.hillFar, 260, [120, 70, 140, 60, 110])),
    near: uri(hills(t.hillNear, 200, [110, 150, 80, 130], 700)),
    decor: uri(decorLayer(t)),
    ground: uri(groundTile(t)),
  };
}
