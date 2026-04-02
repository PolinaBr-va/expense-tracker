import { inject, Injectable } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { LightTheme } from '../../themes/light-theme';
import { DarkTheme } from '../../themes/dark-theme';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private primeng = inject(PrimeNG);

  private storageKey = 'theme-mode';

  initTheme() {
    const savedMode = (localStorage.getItem(this.storageKey) as ThemeMode) ?? 'light';

    this.applyTheme(savedMode);

    if (savedMode === 'system') {
      this.listenSystemTheme();
    }
  }

  setTheme(mode: ThemeMode) {
    console.log('SET THEME:', mode);
    localStorage.setItem(this.storageKey, mode);

    this.applyTheme(mode);

    if (mode === 'system') {
      this.listenSystemTheme();
    }
  }

  getTheme(): ThemeMode {
    return (localStorage.getItem(this.storageKey) as ThemeMode) ?? 'light';
  }

  private applyTheme(mode: ThemeMode) {
    const isDark =
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('p-dark', isDark);

    this.primeng.theme.set({
      preset: isDark ? DarkTheme : LightTheme,
    });
  }

  private listenSystemTheme() {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', () => {
      if (this.getTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }
}
