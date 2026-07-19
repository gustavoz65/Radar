import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [MatCardModule],
  template: `
    <div class="mx-auto max-w-5xl">
      <h1 class="mb-1 text-2xl font-semibold tracking-tight">Olá, {{ auth.userName() }}</h1>
      <p class="mb-6 opacity-70">Bem-vindo ao Omnia. Sua operação em um só lugar.</p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (card of placeholders; track card.title) {
          <mat-card appearance="outlined">
            <mat-card-content class="py-6">
              <div class="text-sm opacity-70">{{ card.title }}</div>
              <div class="mt-1 text-3xl font-semibold">{{ card.value }}</div>
              <div class="mt-1 text-xs opacity-60">{{ card.hint }}</div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
})
export class DashboardPage {
  protected readonly auth = inject(AuthService);

  /** Widgets reais chegam com o módulo analytics (Fase 2); layout já respeita papéis/tema. */
  protected readonly placeholders = [
    { title: 'Agendamentos hoje', value: '—', hint: 'módulo Agenda (Fase 1)' },
    { title: 'Faturamento do mês', value: '—', hint: 'módulo Financeiro (Fase 2)' },
    { title: 'Novos clientes', value: '—', hint: 'módulo Clientes (Fase 1)' },
  ];
}
