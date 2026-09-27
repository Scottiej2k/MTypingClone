import type { App, Route, Screen } from '../app';
import { WORLDS, getWorld } from '../data/lessons';
import { CHARACTERS, HATS, characterSvg, getCharacter } from '../data/characters';
import { audio } from '../game/audio';
import {
  clearProgress,
  currentLevelId,
  defaultProgress,
  isCharacterUnlocked,
  isHatUnlocked,
  isLevelComplete,
  isLevelUnlocked,
  isWorldComplete,
  isWorldUnlocked,
} from '../game/progress';
import { keyLabel } from '../game/keyboard';
import { h, icon } from './dom';
import { sceneryFor } from './scenery';

function topBar(app: App, title: string, back: Route, extra: Node[] = []): HTMLElement {
  return h(
    'header',
    { class: 'topbar' },
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', html: icon('back'), onclick: () => app.go(back) }),
    h('h1', { class: 'topbar-title' }, title),
    h('div', { class: 'topbar-extra' }, ...extra),
  );
}

function onKey(handler: (e: KeyboardEvent) => void): { mount(): void; destroy(): void } {
  return {
    mount: () => window.addEventListener('keydown', handler),
    destroy: () => window.removeEventListener('keydown', handler),
  };
}

// ---------------------------------------------------------------- Title

export function titleScreen(app: App): Screen {
  const p = app.progress;
  const friends = h('div', { class: 'title-friends' });
  CHARACTERS.forEach((c, i) => {
    const unlocked = isCharacterUnlocked(p, c.id);
    const el = h('div', { class: `title-friend${c.id === p.character ? ' chosen' : ''}`, html: characterSvg(c.id, c.id === p.character ? p.hat : 'none', { silhouette: !unlocked }) });
    el.style.setProperty('--delay', `${i * 0.12}s`);
    friends.append(el);
  });

  const play = () => {
    audio.unlock();
    audio.click();
    app.go({ name: 'map' });
  };
  const keys = onKey((e) => {
    // Let Enter/Space activate a focused button (keyboard navigation) instead of always playing.
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) {
      e.preventDefault();
      play();
    }
  });

  const logo = h(
    'div',
    { class: 'logo' },
    h('div', { class: 'logo-small' }, `${getCharacter(p.character).name}’s`),
    h('div', { class: 'logo-big' }, ...'Typing'.split('').map((ch, i) => h('span', { style: `--i:${i}` }, ch))),
    h('div', { class: 'logo-sub' }, 'Adventure'),
  );

  const el = h(
    'div',
    { class: 'screen title' },
    h('div', { class: 'title-clouds', 'aria-hidden': 'true' }, h('span'), h('span'), h('span'), h('span')),
    h(
      'main',
      { class: 'title-main' },
      logo,
      friends,
      h(
        'div',
        { class: 'title-actions' },
        h('button', { class: 'btn primary huge', type: 'button', onclick: play }, h('span', { html: icon('play') }), 'Play'),
        h(
          'div',
          { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', onclick: () => (audio.unlock(), app.go({ name: 'friends', from: { name: 'title' } })) }, h('span', { html: icon('star') }), 'Friends & Hats'),
          h('button', { class: 'btn', type: 'button', onclick: () => (audio.unlock(), app.go({ name: 'settings', from: { name: 'title' } })) }, h('span', { html: icon('gear') }), 'Settings'),
        ),
        h('p', { class: 'tiny' }, 'Press ', h('kbd', {}, 'Enter'), ' to play'),
      ),
    ),
    h('footer', { class: 'title-footer' }, 'A cute typing adventure inspired by the classic Mario Teaches Typing'),
  );

  return {
    el,
    mounted() {
      audio.play('title');
      keys.mount();
    },
    destroy: keys.destroy,
  };
}

// ---------------------------------------------------------------- Map

export function mapScreen(app: App, worldId?: number): Screen {
  const p = app.progress;
  const current = currentLevelId(p);
  let selected = worldId ?? Number(current.split('-')[0]);
  if (!isWorldUnlocked(p, selected)) selected = 1;

  const avatarBtn = h('button', {
    class: 'avatar-btn',
    type: 'button',
    'aria-label': 'Change friend',
    html: characterSvg(p.character, p.hat),
    onclick: () => app.go({ name: 'friends', from: { name: 'map', world: selected } }),
  });
  const gearBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Settings', html: icon('gear'), onclick: () => app.go({ name: 'settings', from: { name: 'map', world: selected } }) });

  const tabs = h('nav', { class: 'world-tabs', 'aria-label': 'Worlds' });
  const panel = h('div', { class: 'world-panel' });

  function renderTabs(): void {
    tabs.replaceChildren(
      ...WORLDS.map((w) => {
        const unlocked = isWorldUnlocked(p, w.id);
        const done = isWorldComplete(p, w.id);
        const tab = h(
          'button',
          {
            class: `world-tab${w.id === selected ? ' active' : ''}${unlocked ? '' : ' locked'}`,
            type: 'button',
            'aria-pressed': String(w.id === selected),
            disabled: !unlocked,
            onclick: () => {
              selected = w.id;
              audio.click();
              render();
            },
          },
          h('span', { class: 'world-tab-num' }, unlocked ? String(w.id) : ''),
          h('span', { class: 'world-tab-name' }, w.name),
        );
        if (!unlocked) tab.querySelector('.world-tab-num')!.innerHTML = icon('lock');
        if (done) tab.append(h('span', { class: 'world-tab-done', html: icon('check') }));
        tab.style.setProperty('--w-accent', w.theme.accent);
        return tab;
      }),
    );
  }

  function renderPanel(): void {
    const w = getWorld(selected);
    const s = sceneryFor(w.theme);
    const banner = h(
      'div',
      { class: `world-banner${w.theme.night ? ' night' : ''}` },
      h('div', { class: 'wb-layer', style: `background-image:${s.far}` }),
      h('div', { class: 'wb-layer near', style: `background-image:${s.near}` }),
      h('div', { class: 'wb-ground', style: `background-image:${s.ground}` }),
      h('div', { class: 'wb-text' }, h('div', { class: 'eyebrow' }, `World ${w.id}`), h('h2', {}, w.name), h('p', {}, w.tagline)),
    );
    banner.style.setProperty('--sky-top', w.theme.skyTop);
    banner.style.setProperty('--sky-bottom', w.theme.skyBottom);

    const path = h('ol', { class: 'level-path' });
    w.levels.forEach((l, i) => {
      const unlocked = isLevelUnlocked(p, l.id);
      const done = isLevelComplete(p, l.id);
      const isCurrent = l.id === current && unlocked;
      const record = p.completed[l.id];
      const keys = l.newKeys.length && !l.fixed ? l.newKeys : [];
      const node = h(
        'button',
        {
          class: `level-node${done ? ' done' : ''}${isCurrent ? ' current' : ''}${unlocked ? '' : ' locked'}`,
          type: 'button',
          disabled: !unlocked,
          'aria-label': `Level ${l.id}: ${l.title}${done ? ', finished' : ''}${unlocked ? '' : ', locked'}`,
          onclick: () => {
            audio.unlock();
            audio.click();
            app.go({ name: 'play', levelId: l.id });
          },
        },
        h('span', { class: 'node-circle', html: unlocked ? (done ? icon('check') : String(i + 1)) : icon('lock') }),
        isCurrent ? h('span', { class: 'node-avatar', html: characterSvg(p.character, p.hat) }) : null,
      );
      const li = h(
        'li',
        { class: 'level-item' },
        node,
        h('div', { class: 'node-title' }, l.title),
        keys.length ? h('div', { class: 'node-keys' }, ...keys.map((k) => h('span', { class: 'kc small' }, keyLabel(k)))) : null,
        record ? h('div', { class: 'node-best' }, `Best: ${record.bestAccuracy}%`) : null,
      );
      li.style.setProperty('--accent', w.theme.accent);
      path.append(li);
    });

    panel.replaceChildren(banner, path);
  }

  function render(): void {
    renderTabs();
    renderPanel();
  }
  render();

  const keys = onKey((e) => {
    if (e.key === 'Enter' && document.activeElement === document.body) {
      e.preventDefault();
      if (isLevelUnlocked(p, current)) app.go({ name: 'play', levelId: current });
    } else if (e.key === 'Escape') {
      app.go({ name: 'title' });
    }
  });

  const el = h(
    'div',
    { class: 'screen map' },
    topBar(app, 'Pick a level', { name: 'title' }, [gearBtn, avatarBtn]),
    h('main', { class: 'map-main' }, tabs, panel, h('p', { class: 'tiny center' }, 'Press ', h('kbd', {}, 'Enter'), ' to play the next level')),
  );
  return {
    el,
    mounted() {
      audio.play('title');
      keys.mount();
    },
    destroy: keys.destroy,
  };
}

// ---------------------------------------------------------------- Friends

export function friendsScreen(app: App, from: Route = { name: 'title' }): Screen {
  const preview = h('div', { class: 'friend-preview' });
  const friendGrid = h('div', { class: 'pick-grid friends-grid' });
  const hatGrid = h('div', { class: 'pick-grid hats-grid' });

  function render(): void {
    const p = app.progress;
    const c = getCharacter(p.character);
    preview.replaceChildren(
      h('div', { class: 'preview-art', html: characterSvg(c.id, p.hat) }),
      h('h2', {}, c.name),
      h('div', { class: 'eyebrow' }, c.kind),
      h('p', {}, c.blurb),
    );
    preview.style.setProperty('--friend', c.color);

    friendGrid.replaceChildren(
      ...CHARACTERS.map((ch) => {
        const unlocked = isCharacterUnlocked(p, ch.id);
        const btn = h(
          'button',
          {
            class: `pick${ch.id === p.character ? ' selected' : ''}${unlocked ? '' : ' locked'}`,
            type: 'button',
            disabled: !unlocked,
            'aria-pressed': String(ch.id === p.character),
            onclick: () => {
              audio.click();
              app.setProgress({ ...app.progress, character: ch.id });
              render();
            },
          },
          h('div', { class: 'pick-art', html: characterSvg(ch.id, 'none', { silhouette: !unlocked }) }),
          h('b', {}, unlocked ? ch.name : '???'),
          h('small', {}, unlocked ? ch.kind : `Finish ${getWorld(ch.unlockWorld!).name}`),
        );
        btn.style.setProperty('--friend', ch.color);
        return btn;
      }),
    );

    hatGrid.replaceChildren(
      ...HATS.map((hat) => {
        const unlocked = isHatUnlocked(p, hat.id);
        return h(
          'button',
          {
            class: `pick hat${hat.id === p.hat ? ' selected' : ''}${unlocked ? '' : ' locked'}`,
            type: 'button',
            disabled: !unlocked,
            'aria-pressed': String(hat.id === p.hat),
            onclick: () => {
              audio.click();
              app.setProgress({ ...app.progress, hat: hat.id });
              render();
            },
          },
          h('div', { class: 'pick-art', html: characterSvg(p.character, hat.id, { silhouette: !unlocked }) }),
          h('b', {}, hat.name),
          unlocked ? null : h('small', {}, hat.hint),
        );
      }),
    );
  }
  render();

  const keys = onKey((e) => {
    if (e.key === 'Escape') app.go(from);
  });

  return {
    el: h(
      'div',
      { class: 'screen friends' },
      topBar(app, 'Friends & Hats', from),
      h(
        'main',
        { class: 'friends-main' },
        preview,
        h('div', { class: 'friends-lists' }, h('h3', {}, 'Friends'), friendGrid, h('h3', {}, 'Hats'), hatGrid),
      ),
    ),
    mounted: keys.mount,
    destroy: keys.destroy,
  };
}

// ---------------------------------------------------------------- Settings

export function settingsScreen(app: App, from: Route = { name: 'title' }): Screen {
  type Key = keyof typeof app.progress.settings;
  const rows: { key: Key; label: string; desc: string }[] = [
    { key: 'music', label: 'Music', desc: 'Bouncy background tunes' },
    { key: 'sfx', label: 'Sound effects', desc: 'Boops, bonks and fanfares' },
    { key: 'fingerHelper', label: 'Finger helper', desc: 'Show which finger presses each key' },
    { key: 'fingerColors', label: 'Rainbow keyboard', desc: 'Color keys by the finger that presses them' },
  ];

  const list = h('div', { class: 'settings-list' });
  function renderList(): void {
    list.replaceChildren(
      ...rows.map((r) => {
        const on = app.progress.settings[r.key];
        return h(
          'button',
          {
            class: 'setting',
            type: 'button',
            role: 'switch',
            'aria-checked': String(on),
            onclick: () => {
              const next = !app.progress.settings[r.key];
              app.setProgress({ ...app.progress, settings: { ...app.progress.settings, [r.key]: next } });
              if (r.key === 'music') audio.setMusic(next);
              if (r.key === 'sfx') audio.setSfx(next);
              audio.click();
              renderList();
            },
          },
          h('span', { class: 'setting-text' }, h('b', {}, r.label), h('small', {}, r.desc)),
          h('span', { class: `switch${on ? ' on' : ''}` }, h('span', { class: 'knob' })),
        );
      }),
    );
  }
  renderList();

  let armed = false;
  const reset = h('button', { class: 'btn danger', type: 'button' }, 'Erase all progress');
  reset.addEventListener('click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = 'Are you sure? Click again to erase';
      return;
    }
    clearProgress();
    app.setProgress({ ...defaultProgress(), settings: app.progress.settings });
    reset.textContent = 'Progress erased';
    reset.setAttribute('disabled', '');
  });

  const keys = onKey((e) => {
    if (e.key === 'Escape') app.go(from);
  });

  return {
    el: h(
      'div',
      { class: 'screen settings' },
      topBar(app, 'Settings', from),
      h('main', { class: 'settings-main card' }, list, h('div', { class: 'danger-zone' }, h('p', {}, 'Start over from the very beginning:'), reset)),
    ),
    mounted: keys.mount,
    destroy: keys.destroy,
  };
}
