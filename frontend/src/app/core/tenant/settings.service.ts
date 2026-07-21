import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface TenantSettings {
  brandColor: string;
  logoUrl: string | null;
  defaultTheme: 'system' | 'light' | 'dark';
  openingHour: number;
  closingHour: number;
  customerTerm: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  readonly settings = signal<TenantSettings | null>(null);

  async load(): Promise<TenantSettings> {
    const settings = await firstValueFrom(this.http.get<TenantSettings>('/api/v1/tenant/settings'));
    this.settings.set(settings);
    this.applyBrand(settings.brandColor);
    return settings;
  }

  async save(settings: TenantSettings): Promise<TenantSettings> {
    const saved = await firstValueFrom(
      this.http.put<TenantSettings>('/api/v1/tenant/settings', settings),
    );
    this.settings.set(saved);
    this.applyBrand(saved.brandColor);
    return saved;
  }

  /** Applies the tenant's brand color to the Material primary token at runtime (ADR-007). */
  private applyBrand(hex: string): void {
    document.documentElement.style.setProperty('--mat-sys-primary', hex);
    document.documentElement.style.setProperty('--omnia-brand', hex);
  }
}
