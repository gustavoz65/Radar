import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { CustomerService } from '../customers/customer.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="mx-auto max-w-5xl">
      <h1 class="mb-1 text-2xl font-semibold tracking-tight">Olá, {{ auth.userName() }}</h1>
      <p class="mb-6 opacity-70">Bem-vindo ao Omnia. Sua operação em um só lugar.</p>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <mat-card appearance="outlined">
          <mat-card-content class="py-6">
            <div class="text-sm opacity-70">Agendamentos hoje</div>
            <div class="mt-1 text-3xl font-semibold">{{ appointmentsToday() }}</div>
            <a matButton routerLink="/agenda" class="mt-2 !px-0">Ver agenda</a>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-content class="py-6">
            <div class="text-sm opacity-70">Total de clientes</div>
            <div class="mt-1 text-3xl font-semibold">{{ totalCustomers() }}</div>
            <a matButton routerLink="/customers" class="mt-2 !px-0">Ver clientes</a>
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-content class="py-6">
            <div class="text-sm opacity-70">Faturamento do mês</div>
            <div class="mt-1 text-3xl font-semibold opacity-50">—</div>
            <div class="mt-1 text-xs opacity-60">módulo Financeiro (Fase 2)</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card appearance="outlined" class="mt-6">
        <mat-card-content class="py-6">
          <h2 class="mb-2 text-lg font-medium">Primeiros passos</h2>
          <ul class="flex flex-col gap-2 text-sm">
            <li class="flex items-center gap-2">
              <mat-icon class="!text-base opacity-60">check_circle</mat-icon>
              <a routerLink="/catalog" class="underline">Cadastre seus serviços</a>
              — definem duração e preço na agenda.
            </li>
            <li class="flex items-center gap-2">
              <mat-icon class="!text-base opacity-60">check_circle</mat-icon>
              <a routerLink="/customers" class="underline">Cadastre seus clientes</a>.
            </li>
            <li class="flex items-center gap-2">
              <mat-icon class="!text-base opacity-60">check_circle</mat-icon>
              <a routerLink="/agenda" class="underline">Faça o primeiro agendamento</a>.
            </li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class DashboardPage {
  protected readonly auth = inject(AuthService);
  private readonly scheduling = inject(SchedulingService);
  private readonly customers = inject(CustomerService);

  protected readonly appointmentsToday = signal<number | string>('—');
  protected readonly totalCustomers = signal<number | string>('—');

  constructor() {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    void this.scheduling
      .agenda(from, to)
      .then((list) => this.appointmentsToday.set(list.length))
      .catch(() => this.appointmentsToday.set('—'));
    void this.customers
      .search('', 0, 1)
      .then((page) => this.totalCustomers.set(page.page.totalElements))
      .catch(() => this.totalCustomers.set('—'));
  }
}
