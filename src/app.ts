import type { Progress } from './game/progress';

export type Route =
  | { name: 'title' }
  | { name: 'map'; world?: number }
  | { name: 'play'; levelId: string }
  | { name: 'friends'; from?: Route }
  | { name: 'settings'; from?: Route };

export interface App {
  readonly progress: Progress;
  setProgress(p: Progress): void;
  go(route: Route): void;
}

export interface Screen {
  el: HTMLElement;
  /** Called once the element is in the document (for measuring / focusing). */
  mounted?(): void;
  destroy?(): void;
}
