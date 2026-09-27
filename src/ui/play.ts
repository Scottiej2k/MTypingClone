import type { App, Screen } from '../app';
import { getLevel, getWorld, nextLevel, WORLDS } from '../data/lessons';
import { characterSvg, getCharacter, HATS } from '../data/characters';
import { generateSequence } from '../game/sequence';
import { FINGER_NAMES, fingerFor, keyLabel, normaliseKey } from '../game/keyboard';
import { audio } from '../game/audio';
import { accuracyOf, isLevelUnlocked, recordResult, speedOf, type Unlock } from '../game/progress';
import { h, icon } from './dom';
import { sceneryFor } from './scenery';
import { FINGER_COLORS, HandsView, KeyboardView } from './keyboardView';
import { confetti } from './confetti';

const CHEERS = ['Great!', 'Super!', 'Wow!', 'Amazing!', 'Awesome!', 'Fantastic!', 'You rock!'];

/** Parallax speed of each background layer relative to the ground. */
const PARALLAX = { sky: 0.04, far: 0.18, near: 0.38, decor: 0.62 } as const;
type LayerName = keyof typeof PARALLAX;

const FLAG_SVG = (color: string) => `
  <svg viewBox="0 0 60 160" aria-hidden="true">
    <rect x="8" y="10" width="7" height="146" rx="3.5" fill="#fff" stroke="#3b2f4a" stroke-width="3"/>
    <circle cx="11.5" cy="10" r="7" fill="#ffd23f" stroke="#3b2f4a" stroke-width="3"/>
    <g class="flag-cloth">
      <path d="M15 20 Q36 14 56 24 Q36 32 15 44 Z" fill="${color}" stroke="#3b2f4a" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 24 l1.8 3.6 4 .6 -2.9 2.8 .7 4 -3.6 -1.9 -3.6 1.9 .7 -4 -2.9 -2.8 4 -.6Z" fill="#fff"/>
    </g>
    <rect x="0" y="150" width="24" height="10" rx="5" fill="#3b2f4a" opacity=".25"/>
  </svg>`;

const SPROUT_SVG = (color: string) => `
  <svg viewBox="0 0 30 40" aria-hidden="true">
    <path d="M15 40 V20" stroke="#3f9d4a" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M15 30 Q6 28 5 20 Q13 21 15 30Z" fill="#5cbf60"/>
    ${[0, 72, 144, 216, 288].map((a) => `<circle cx="${15 + Math.cos((a * Math.PI) / 180) * 5}" cy="${14 + Math.sin((a * Math.PI) / 180) * 5}" r="4.2" fill="${color}"/>`).join('')}
    <circle cx="15" cy="14" r="3.2" fill="#ffe066"/>
  </svg>`;

function formatTime(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function keycap(key: string, extraClass = ''): HTMLElement {
  const el = h('span', { class: `kc ${extraClass}` }, keyLabel(key));
  el.style.setProperty('--finger', FINGER_COLORS[fingerFor(key)]);
  return el;
}

export function playScreen(app: App, levelId: string): Screen {
  const found = getLevel(levelId);
  if (!found || !isLevelUnlocked(app.progress, levelId)) {
    queueMicrotask(() => app.go({ name: 'map' }));
    return { el: h('div', { class: 'screen' }) };
  }
  const level = found;
  const world = getWorld(level.world);
  const theme = world.theme;
  const seq = generateSequence(level);
  const settings = () => app.progress.settings;
  const heroSvg = () => characterSvg(app.progress.character, app.progress.hat);

  let index = 0;
  let mistakes = 0;
  let missStreak = 0;
  let streak = 0;
  const missedKeys = new Map<string, number>();
  let state: 'ready' | 'countdown' | 'playing' | 'paused' | 'finished' = 'ready';
  let startedAt = 0;
  let pausedAt = 0;
  let pausedTotal = 0;
  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
    return id;
  };

  // ---------- HUD ----------
  const toggle = (kind: 'music' | 'sfx') => {
    const btn = h('button', {
      class: 'icon-btn toggle',
      type: 'button',
      'aria-label': kind === 'music' ? 'Music' : 'Sound effects',
      html: icon(kind === 'music' ? 'music' : 'sound'),
    });
    const sync = () => {
      const on = settings()[kind];
      btn.classList.toggle('off', !on);
      btn.setAttribute('aria-pressed', String(on));
    };
    btn.addEventListener('click', () => {
      const on = !settings()[kind];
      app.setProgress({ ...app.progress, settings: { ...settings(), [kind]: on } });
      if (kind === 'music') audio.setMusic(on);
      else audio.setSfx(on);
      sync();
      btn.blur();
    });
    sync();
    return btn;
  };

  const oopsCount = h('span', { class: 'oops-count' }, '0');
  const oopsEl = h('div', { class: 'oops', title: 'Oopses so far' }, h('span', { class: 'oops-label' }, 'Oops'), oopsCount);
  const progressFill = h('div', { class: 'progress-fill' });
  const progressHero = h('div', { class: 'progress-hero', html: heroSvg() });
  const hud = h(
    'header',
    { class: 'hud' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Pause', html: icon('pause'), onclick: () => pause() }),
    h('div', { class: 'level-chip' }, h('span', { class: 'level-num' }, level.id), h('span', { class: 'level-title' }, level.title)),
    h('div', { class: 'progress', 'aria-hidden': 'true' }, h('div', { class: 'progress-track' }, progressFill), progressHero, h('div', { class: 'progress-flag', html: FLAG_SVG(theme.accent) })),
    oopsEl,
    toggle('music'),
    toggle('sfx'),
  );

  // ---------- Stage ----------
  const scenery = sceneryFor(theme);
  const layers = {} as Record<LayerName, HTMLElement>;
  for (const name of Object.keys(PARALLAX) as LayerName[]) {
    layers[name] = h('div', { class: `layer layer-${name}` });
    layers[name].style.backgroundImage = scenery[name];
  }
  const track = h('div', { class: 'track' });
  const ground = h('div', { class: 'ground' });
  ground.style.backgroundImage = scenery.ground;
  track.append(ground);

  const blocks = seq.map((key, i) => {
    const b = h('div', { class: 'block', 'data-i': i }, h('span', { class: 'block-letter' }, keyLabel(key)));
    track.append(b);
    return b;
  });
  const goal = h('div', { class: 'goal', html: FLAG_SVG(theme.accent) });
  track.append(goal);

  const heroIdle = h('div', { class: 'hero-idle', html: heroSvg() });
  const heroHop = h('div', { class: 'hero-hop' }, heroIdle);
  const bubble = h('div', { class: 'bubble', role: 'status', 'aria-live': 'assertive' });
  const hero = h('div', { class: 'hero' }, h('div', { class: 'hero-shadow' }), heroHop, bubble);
  track.append(hero);

  const capsHint = h('div', { class: 'caps-hint' }, 'Caps Lock is on — that’s okay!');
  const overlay = h('div', { class: 'overlay' });
  const stage = h(
    'section',
    { class: `stage${theme.night ? ' night' : ''}` },
    layers.sky,
    layers.far,
    layers.near,
    layers.decor,
    track,
    capsHint,
  );
  stage.style.setProperty('--sky-top', theme.skyTop);
  stage.style.setProperty('--sky-bottom', theme.skyBottom);
  stage.style.setProperty('--block', theme.block);
  stage.style.setProperty('--block-dark', theme.blockDark);
  stage.style.setProperty('--block-text', theme.blockText);
  stage.style.setProperty('--accent', theme.accent);

  // ---------- Helper (keyboard + hands) ----------
  const keyboard = new KeyboardView((key) => {
    audio.unlock();
    handleKey(key);
  });
  const hands = new HandsView();
  const hint = h('div', { class: 'hint', 'aria-live': 'polite' });
  const helper = h('section', { class: 'helper' }, hint, h('div', { class: 'helper-row' }, hands.left, keyboard.el, hands.right));

  const applySettings = () => {
    keyboard.setFingerColors(settings().fingerColors);
    helper.classList.toggle('no-hands', !settings().fingerHelper);
  };
  applySettings();

  const root = h('div', { class: 'screen play' }, hud, stage, helper, overlay);
  root.style.setProperty('--accent', theme.accent);

  // ---------- Geometry ----------
  let W = 0;
  let S = 0; // spacing between blocks
  let heroSize = 0;
  let startX = 0;
  const blockX = (i: number) => startX + (i + 1) * S;
  const heroX = (i: number) => blockX(i) - S * 0.62;
  const goalX = () => blockX(seq.length - 1) + S * 1.1;

  function layout(): void {
    W = stage.clientWidth;
    const H = stage.clientHeight;
    const groundH = Math.max(48, Math.round(H * 0.22));
    const blockSize = Math.round(Math.min(104, Math.max(52, Math.min(H * 0.2, W / 5.5))));
    S = Math.round(Math.max(blockSize * 1.85, Math.min(220, W / 5)));
    heroSize = Math.round(blockSize * 1.35);
    startX = W * 0.1;
    stage.style.setProperty('--ground-h', `${groundH}px`);
    stage.style.setProperty('--block-size', `${blockSize}px`);
    stage.style.setProperty('--hero-size', `${heroSize}px`);
    blocks.forEach((b, i) => (b.style.left = `${blockX(i) - blockSize / 2}px`));
    goal.style.left = `${goalX()}px`;
    const length = goalX() + W * 2;
    ground.style.left = `${-W}px`;
    ground.style.width = `${length + W}px`;
    for (const name of Object.keys(PARALLAX) as LayerName[]) {
      layers[name].style.width = `${length * PARALLAX[name] + W * 2}px`;
    }
    stage.classList.add('no-anim');
    place();
    void stage.offsetWidth;
    stage.classList.remove('no-anim');
  }

  function place(): void {
    const x = state === 'finished' ? goalX() - heroSize * 0.35 : heroX(index);
    hero.style.transform = `translate3d(${x - heroSize / 2}px, 0, 0)`;
    const cam = Math.min(x - W * 0.3, goalX() + S - W);
    track.style.transform = `translate3d(${-cam}px, 0, 0)`;
    for (const name of Object.keys(PARALLAX) as LayerName[]) {
      layers[name].style.transform = `translate3d(${-cam * PARALLAX[name] - W * 0.5}px, 0, 0)`;
    }
  }

  function updateProgress(): void {
    const pct = (index / seq.length) * 100;
    progressFill.style.width = `${pct}%`;
    progressHero.style.left = `${pct}%`;
  }

  // ---------- Feedback ----------
  function restartClass(el: Element, cls: string): void {
    el.classList.remove(cls);
    void (el as HTMLElement).offsetWidth;
    el.classList.add(cls);
  }

  function setTarget(): void {
    const key = seq[index];
    blocks.forEach((b, i) => b.classList.toggle('current', i === index));
    keyboard.setTarget(key);
    const finger = fingerFor(key);
    hands.setFinger(settings().fingerHelper ? finger : null);
    showHint();
  }

  function showHint(wrongKey?: string): void {
    const key = seq[index];
    const finger = fingerFor(key);
    const fingerEl = h('b', { class: 'finger-name' }, FINGER_NAMES[finger]);
    fingerEl.style.setProperty('--finger', FINGER_COLORS[finger]);
    hint.classList.toggle('wrong', !!wrongKey);
    if (wrongKey !== undefined) {
      hint.replaceChildren(
        h('span', {}, 'You pressed '),
        keycap(wrongKey, 'bad'),
        h('span', {}, ' — find '),
        keycap(key, 'good'),
        ...(settings().fingerHelper ? [h('span', {}, ' with your '), fingerEl] : []),
      );
    } else {
      hint.replaceChildren(
        h('span', {}, 'Press '),
        keycap(key, 'good'),
        ...(settings().fingerHelper ? [h('span', {}, ' with your '), fingerEl] : []),
      );
    }
  }

  let bubbleTimer = 0;
  function showBubble(wrongKey: string): void {
    const key = seq[index];
    const lines: (HTMLElement | string)[] = [
      h('div', { class: 'bubble-title' }, 'Oops!'),
      h('div', { class: 'bubble-row' }, h('span', {}, 'That was '), keycap(wrongKey, 'bad')),
      h('div', { class: 'bubble-row' }, h('span', {}, 'Find '), keycap(key, 'good')),
    ];
    if (missStreak >= 2) {
      const tip = h('div', { class: 'bubble-tip' }, `Use your ${FINGER_NAMES[fingerFor(key)]}`);
      tip.style.setProperty('--finger', FINGER_COLORS[fingerFor(key)]);
      lines.push(tip);
    }
    bubble.replaceChildren(...lines);
    restartClass(bubble, 'show');
    window.clearTimeout(bubbleTimer);
    bubbleTimer = later(() => bubble.classList.remove('show'), 2200);
  }

  function burst(i: number): void {
    const colors = [theme.block, theme.accent, '#ffffff', '#ffe066'];
    const cx = blockX(i);
    for (let n = 0; n < 12; n++) {
      const angle = (n / 12) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 50 + Math.random() * 50;
      const p = h('span', { class: `spark${n % 3 === 0 ? ' star' : ''}` });
      p.style.left = `${cx}px`;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist - 30}px`);
      p.style.setProperty('--c', colors[n % colors.length]);
      track.append(p);
      later(() => p.remove(), 800);
    }
    const sprout = h('div', { class: 'sprout', html: SPROUT_SVG(colors[i % 2 === 0 ? 0 : 1]) });
    sprout.style.left = `${cx}px`;
    track.append(sprout);
  }

  function floatWrong(key: string): void {
    const f = h('div', { class: 'wrong-float' }, keyLabel(key));
    f.style.left = `${blockX(index)}px`;
    track.append(f);
    later(() => f.remove(), 1000);
  }

  function cheer(): void {
    const c = h('div', { class: 'cheer' }, CHEERS[Math.floor(Math.random() * CHEERS.length)]);
    stage.append(c);
    later(() => c.remove(), 1300);
  }

  // ---------- Game flow ----------
  function handleKey(key: string): void {
    if (state !== 'playing') return;
    if (key === seq[index]) correct(key);
    else wrong(key);
  }

  function correct(key: string): void {
    const b = blocks[index];
    b.classList.remove('current', 'shake', 'bad');
    b.classList.add('cleared');
    burst(index);
    keyboard.flash(key, 'right');
    streak++;
    missStreak = 0;
    audio.correct(streak);
    heroHop.classList.remove('wobble');
    restartClass(heroHop, 'hop');
    bubble.classList.remove('show');
    index++;
    updateProgress();
    if (streak % 10 === 0) cheer();
    if (index >= seq.length) {
      finish();
    } else {
      setTarget();
      place();
    }
  }

  function wrong(key: string): void {
    const target = seq[index];
    mistakes++;
    missStreak++;
    streak = 0;
    missedKeys.set(target, (missedKeys.get(target) ?? 0) + 1);
    const b = blocks[index];
    b.classList.add('bad');
    restartClass(b, 'shake');
    keyboard.flash(key, 'wrong');
    audio.wrong();
    heroHop.classList.remove('hop');
    restartClass(heroHop, 'wobble');
    oopsCount.textContent = String(mistakes);
    restartClass(oopsEl, 'bump');
    floatWrong(key);
    showBubble(key);
    showHint(key);
    if (missStreak >= 2 && settings().fingerHelper) hands.nudge(fingerFor(target));
    later(() => b.classList.remove('bad'), 600);
  }

  function showOverlay(card: HTMLElement): void {
    overlay.replaceChildren(card);
    overlay.classList.add('show');
  }

  function hideOverlay(): void {
    overlay.classList.remove('show');
    overlay.replaceChildren();
  }

  function readyCard(): HTMLElement {
    const keys = level.newKeys.length ? level.newKeys : level.fixed ? [] : level.pool;
    const keyList = h('div', { class: 'key-list' });
    for (const k of keys) {
      const item = h('div', { class: 'key-item' }, keycap(k, 'big'));
      if (level.newKeys.length) item.append(h('small', {}, FINGER_NAMES[fingerFor(k)]));
      keyList.append(item);
    }
    const startBtn = h('button', { class: 'btn primary big', type: 'button', onclick: () => begin() }, 'Start ', h('kbd', {}, 'Space'));
    return h(
      'div',
      { class: 'card ready-card pop-in' },
      h('div', { class: 'eyebrow' }, `World ${world.id} · ${world.name}`),
      h('h2', {}, `${level.id}  ${level.title}`),
      h('p', { class: 'lead' }, level.fixed ? 'Type the whole alphabet, A to Z!' : level.newKeys.length ? 'New keys to learn:' : 'Keys in this level:'),
      keys.length ? keyList : null,
      h('p', { class: 'tip' }, 'Rest your fingers on ', keycap('a'), keycap('s'), keycap('d'), keycap('f'), ' and ', keycap('j'), keycap('k'), keycap('l'), keycap(';'), '. Feel the bumps on F and J!'),
      startBtn,
    );
  }

  function begin(): void {
    if (state !== 'ready') return;
    audio.unlock();
    state = 'countdown';
    const steps = ['3', '2', '1', 'Go!'];
    steps.forEach((label, i) => {
      later(() => {
        const n = h('div', { class: 'countdown' }, label);
        overlay.replaceChildren(n);
        overlay.classList.add('show', 'clear');
        audio.countdown(i === steps.length - 1);
      }, i * 600);
    });
    later(() => {
      overlay.classList.remove('clear');
      hideOverlay();
      state = 'playing';
      startedAt = performance.now();
    }, steps.length * 600 - 150);
  }

  function pause(): void {
    if (state !== 'playing') return;
    state = 'paused';
    pausedAt = performance.now();
    showOverlay(
      h(
        'div',
        { class: 'card pause-card pop-in' },
        h('h2', {}, 'Paused'),
        h('p', { class: 'lead' }, 'Take a little break!'),
        h(
          'div',
          { class: 'btn-row' },
          h('button', { class: 'btn primary', type: 'button', onclick: () => resume() }, h('span', { html: icon('play') }), 'Keep going'),
          h('button', { class: 'btn', type: 'button', onclick: () => app.go({ name: 'play', levelId }) }, h('span', { html: icon('replay') }), 'Restart'),
          h('button', { class: 'btn', type: 'button', onclick: () => app.go({ name: 'map', world: level.world }) }, h('span', { html: icon('map') }), 'Map'),
        ),
      ),
    );
  }

  function resume(): void {
    if (state !== 'paused') return;
    pausedTotal += performance.now() - pausedAt;
    state = 'playing';
    hideOverlay();
  }

  function finish(): void {
    state = 'finished';
    const seconds = (performance.now() - startedAt - pausedTotal) / 1000;
    keyboard.setTarget(null);
    hands.setFinger(null);
    hint.classList.remove('wrong');
    hint.replaceChildren(h('span', {}, 'You made it to the flag!'));
    later(() => {
      place();
      goal.classList.add('reached');
      heroHop.classList.remove('hop', 'wobble');
      heroHop.classList.add('dance');
      audio.fanfare();
      confetti(stage);
    }, 380);

    const result = { levelId, letters: seq.length, mistakes, seconds };
    const { progress, unlocks } = recordResult(app.progress, result);
    app.setProgress(progress);
    later(() => showResults(result, unlocks), 1800);
  }

  function praise(accuracy: number): string {
    if (accuracy === 100) return 'Perfect! Not a single oops!';
    if (accuracy >= 90) return 'Fantastic typing!';
    if (accuracy >= 75) return 'Great job — you’re getting it!';
    return 'You did it! Practice makes perfect.';
  }

  function unlockCard(u: Unlock): HTMLElement {
    if (u.type === 'character') {
      const c = getCharacter(u.id);
      return h('div', { class: 'unlock' }, h('div', { class: 'unlock-art', html: characterSvg(c.id) }), h('div', {}, h('small', {}, 'New friend!'), h('b', {}, `${c.name} the ${c.kind}`)));
    }
    if (u.type === 'hat') {
      const hat = HATS.find((x) => x.id === u.id)!;
      return h('div', { class: 'unlock' }, h('div', { class: 'unlock-art', html: characterSvg(app.progress.character, hat.id) }), h('div', {}, h('small', {}, 'New hat!'), h('b', {}, hat.name)));
    }
    const w = WORLDS.find((x) => x.id === u.id)!;
    const art = h('div', { class: 'unlock-art world-art' });
    art.style.background = `linear-gradient(${w.theme.skyTop}, ${w.theme.skyBottom})`;
    art.innerHTML = icon('map');
    return h('div', { class: 'unlock' }, art, h('div', {}, h('small', {}, 'New world!'), h('b', {}, w.name)));
  }

  let primaryAction: (() => void) | null = null;

  function showResults(result: { letters: number; mistakes: number; seconds: number }, unlocks: Unlock[]): void {
    const accuracy = accuracyOf(result);
    const speed = speedOf(result);
    const next = nextLevel(levelId);
    const goNext = next && isLevelUnlocked(app.progress, next.id) ? () => app.go({ name: 'play', levelId: next.id }) : () => app.go({ name: 'map', world: level.world });
    primaryAction = goNext;

    const stat = (label: string, value: string, sub?: string) =>
      h('div', { class: 'stat' }, h('div', { class: 'stat-value' }, value), h('div', { class: 'stat-label' }, label), sub ? h('div', { class: 'stat-sub' }, sub) : null);

    const practice = [...missedKeys.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const card = h(
      'div',
      { class: 'card results-card pop-in' },
      h('div', { class: 'results-hero dance', html: heroSvg() }),
      h('h2', {}, 'Level complete!'),
      h('p', { class: 'lead' }, praise(accuracy)),
      h('div', { class: 'stats' }, stat('Accuracy', `${accuracy}%`), stat('Speed', String(speed), 'letters / min'), stat('Time', formatTime(result.seconds))),
      practice.length
        ? h('div', { class: 'practice' }, h('span', {}, 'Keys to practice:'), ...practice.map(([k, n]) => h('span', { class: 'practice-key' }, keycap(k), h('small', {}, `×${n}`))))
        : null,
      unlocks.length ? h('div', { class: 'unlocks' }, ...unlocks.map(unlockCard)) : null,
      h(
        'div',
        { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', onclick: () => app.go({ name: 'play', levelId }) }, h('span', { html: icon('replay') }), 'Play again'),
        h('button', { class: 'btn', type: 'button', onclick: () => app.go({ name: 'map', world: level.world }) }, h('span', { html: icon('map') }), 'Map'),
        h('button', { class: 'btn primary', type: 'button', onclick: goNext }, next ? 'Next level' : 'Finish', h('span', { html: icon('next') })),
      ),
      h('p', { class: 'tiny' }, 'Press ', h('kbd', {}, 'Enter'), ' to continue'),
    );
    showOverlay(card);
    if (unlocks.length) later(() => audio.unlockChime(), 400);
  }

  // ---------- Input ----------
  function onKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    capsHint.classList.toggle('show', e.getModifierState?.('CapsLock') ?? false);

    if (e.key === 'Escape') {
      e.preventDefault();
      if (state === 'playing') pause();
      else if (state === 'paused') resume();
      else if (state === 'finished' && primaryAction) app.go({ name: 'map', world: level.world });
      return;
    }
    if (state === 'ready') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        begin();
      }
      return;
    }
    if (state === 'paused') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        resume();
      }
      return;
    }
    if (state === 'finished') {
      if (e.key === 'Enter' && primaryAction) {
        e.preventDefault();
        primaryAction();
      }
      return;
    }
    if (state !== 'playing' || e.repeat) {
      if (state === 'playing' || state === 'countdown') e.preventDefault();
      return;
    }
    const key = normaliseKey(e.key);
    if (key === null) return;
    e.preventDefault(); // stop Space scrolling and "/" opening quick-find
    handleKey(key);
  }

  const onBlur = () => pause();
  const resizeObserver = new ResizeObserver(() => layout());

  return {
    el: root,
    mounted() {
      audio.play(`world${world.id}`);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('blur', onBlur);
      resizeObserver.observe(stage);
      layout();
      updateProgress();
      setTarget();
      showOverlay(readyCard());
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onBlur);
      resizeObserver.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    },
  };
}
