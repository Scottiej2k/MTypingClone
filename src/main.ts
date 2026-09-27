import '@fontsource/fredoka/latin-400.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/fredoka/latin-700.css';
import './style.css';

import type { App, Route, Screen } from './app';
import { audio } from './game/audio';
import { loadProgress, saveProgress, type Progress } from './game/progress';
import { playScreen } from './ui/play';
import { friendsScreen, mapScreen, settingsScreen, titleScreen } from './ui/screens';

const root = document.getElementById('app')!;
let progress: Progress = loadProgress();
let screen: Screen | null = null;

audio.setMusic(progress.settings.music);
audio.setSfx(progress.settings.sfx);

// Browsers only allow audio after a user gesture.
const unlockAudio = () => audio.unlock();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

const app: App = {
  get progress() {
    return progress;
  },
  setProgress(p) {
    progress = p;
    saveProgress(p);
  },
  go(route: Route) {
    screen?.destroy?.();
    switch (route.name) {
      case 'title':
        screen = titleScreen(app);
        break;
      case 'map':
        screen = mapScreen(app, route.world);
        break;
      case 'play':
        screen = playScreen(app, route.levelId);
        break;
      case 'friends':
        screen = friendsScreen(app, route.from);
        break;
      case 'settings':
        screen = settingsScreen(app, route.from);
        break;
    }
    root.replaceChildren(screen.el);
    (document.activeElement as HTMLElement | null)?.blur?.();
    screen.mounted?.();
  },
};

app.go({ name: 'title' });
