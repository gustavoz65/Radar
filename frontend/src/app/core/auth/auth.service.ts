import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface Session {
  accessToken: string;
  expiresInSeconds: number;
  userId: string;
  userName: string;
  tenantId: string;
}

const STORAGE_KEY = 'omnia.session';

/**
 * Estado de autenticação via signals (ADR-007). O access token vive em memória/sessionStorage;
 * refresh token httpOnly chega na próxima iteração do backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sessionState = signal<Session | null>(restore());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => this.sessionState() !== null);
  readonly userName = computed(() => this.sessionState()?.userName ?? '');

  async login(tenantSlug: string, email: string, password: string): Promise<void> {
    const session = await firstValueFrom(
      this.http.post<Session>('/api/v1/auth/login', { tenantSlug, email, password }),
    );
    this.sessionState.set(session);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  logout(): void {
    this.sessionState.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    void this.router.navigateByUrl('/login');
  }

  accessToken(): string | null {
    return this.sessionState()?.accessToken ?? null;
  }
}

function restore(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
