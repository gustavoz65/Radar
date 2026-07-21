import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { AnalyticsService, AnalyticsSummary } from './analytics.service';

/** Simple report: 30-day totals and an inline SVG revenue bar chart (no chart lib needed). */
@Component({
  selector: 'app-reports-page',
  imports: [CurrencyPipe, DatePipe, MatCardModule],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-4 text-2xl font-semibold tracking-tight">Relatórios</h1>
      <p class="mb-4 text-sm opacity-70">Últimos 30 dias</p>

      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <mat-card appearance="outlined">
          <mat-card-content class="py-4">
            <div class="text-sm opacity-70">Faturamento</div>
            <div class="text-3xl font-semibold">
              {{ +(summary()?.totalRevenue ?? 0) | currency: 'BRL' }}
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-content class="py-4">
            <div class="text-sm opacity-70">Agendamentos</div>
            <div class="text-3xl font-semibold">{{ summary()?.totalAppointments ?? 0 }}</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card appearance="outlined">
        <mat-card-content class="py-4">
          <h2 class="mb-4 font-medium">Faturamento por dia</h2>
          @if (bars().length === 0) {
            <p class="text-sm opacity-60">
              Sem dados ainda. Finalize vendas para ver o faturamento aqui.
            </p>
          } @else {
            <div class="flex h-48 items-end gap-1">
              @for (b of bars(); track b.date) {
                <div class="flex flex-1 flex-col items-center justify-end" [title]="b.label">
                  <div
                    class="w-full rounded-t bg-[color:var(--mat-sys-primary)]"
                    [style.height.%]="b.heightPct"
                  ></div>
                  <span class="mt-1 text-[9px] opacity-50">{{ b.date | date: 'dd/MM' }}</span>
                </div>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class ReportsPage {
  private readonly analytics = inject(AnalyticsService);

  protected readonly summary = signal<AnalyticsSummary | null>(null);

  protected readonly bars = computed(() => {
    const series = this.summary()?.series ?? [];
    const max = Math.max(1, ...series.map((p) => +p.revenue));
    return series.map((p) => ({
      date: p.date,
      heightPct: (+p.revenue / max) * 100,
      label: `${p.date}: R$ ${(+p.revenue).toFixed(2)}`,
    }));
  });

  constructor() {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 29);
    void this.analytics
      .summary(from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
      .then((s) => this.summary.set(s));
  }
}
