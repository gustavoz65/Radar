import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'omnia.theme';

/**
 * Dark/light por usuário + (futuro) identidade visual por tenant sobrescrevendo tokens CSS
 * (--omnia-brand etc.) a partir das configurações da empresa.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) ?? 'system');

  constructor() {
    this.apply(this.mode());
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(STORAGE_KEY, mode);
    this.apply(mode);
  }

  private apply(mode: ThemeMode): void {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (mode !== 'system') {
      root.classList.add(mode);
    }
  }
}
