import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  Appointment,
  AppointmentStatus,
  Member,
  SchedulingService,
  TransitionAction,
} from './scheduling.service';
import { BookingDialog, BookingDialogData } from './booking.dialog';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Faltou',
};

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'border-l-blue-500',
  CONFIRMED: 'border-l-teal-500',
  IN_PROGRESS: 'border-l-amber-500',
  COMPLETED: 'border-l-emerald-600',
  CANCELLED: 'border-l-gray-400',
  NO_SHOW: 'border-l-red-500',
};

@Component({
  selector: 'app-agenda-page',
  imports: [
    DatePipe,
    CurrencyPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-semibold tracking-tight">Agenda</h1>
        <button matButton="filled" (click)="openBooking()">
          <mat-icon>add</mat-icon>
          Novo agendamento
        </button>
      </div>

      <div class="mb-4 flex items-center gap-2">
        <button matIconButton (click)="shiftDay(-1)" aria-label="Dia anterior">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <button matButton (click)="goToday()">Hoje</button>
        <button matIconButton (click)="shiftDay(1)" aria-label="Próximo dia">
          <mat-icon>chevron_right</mat-icon>
        </button>
        <span class="ml-2 text-lg font-medium capitalize">
          {{ day() | date: 'EEEE, dd/MM/yyyy' }}
        </span>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (appointments().length === 0 && !loading()) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          Nenhum agendamento neste dia. Clique em "Novo agendamento" para começar.
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (a of appointments(); track a.id) {
            <div
              class="flex items-center gap-4 rounded-lg border border-l-4 p-3 {{
                statusClass(a.status)
              }}"
              [class.opacity-60]="a.status === 'CANCELLED' || a.status === 'NO_SHOW'"
            >
              <div class="w-24 shrink-0 text-sm">
                <div class="font-semibold">{{ a.startTime | date: 'HH:mm' }}</div>
                <div class="opacity-60">{{ a.endTime | date: 'HH:mm' }}</div>
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate font-medium">{{ a.customerName }}</div>
                <div class="truncate text-sm opacity-70">
                  {{ a.serviceName }} · {{ a.professionalName }} · {{ +a.price | currency: 'BRL' }}
                </div>
              </div>
              <span
                class="rounded-full bg-[color:var(--mat-sys-secondary-container)] px-3 py-1 text-xs"
              >
                {{ statusLabel(a.status) }}
              </span>
              <button matIconButton [matMenuTriggerFor]="menu" aria-label="Ações">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu>
                @for (t of transitionsFor(a.status); track t.action) {
                  <button mat-menu-item (click)="transition(a, t.action)">{{ t.label }}</button>
                }
              </mat-menu>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AgendaPage {
  private readonly scheduling = inject(SchedulingService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly day = signal<Date>(startOfToday());
  protected readonly appointments = signal<Appointment[]>([]);
  protected readonly loading = signal(false);
  private readonly members = signal<Member[]>([]);

  private readonly range = computed(() => {
    const from = new Date(this.day());
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    return { from, to };
  });

  constructor() {
    void this.scheduling.members().then((m) => this.members.set(m));
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const { from, to } = this.range();
      this.appointments.set(await this.scheduling.agenda(from, to));
    } finally {
      this.loading.set(false);
    }
  }

  protected shiftDay(delta: number): void {
    const next = new Date(this.day());
    next.setDate(next.getDate() + delta);
    this.day.set(next);
    void this.load();
  }

  protected goToday(): void {
    this.day.set(startOfToday());
    void this.load();
  }

  protected statusLabel(status: AppointmentStatus): string {
    return STATUS_LABEL[status];
  }

  protected statusClass(status: AppointmentStatus): string {
    return STATUS_CLASS[status];
  }

  protected transitionsFor(
    status: AppointmentStatus,
  ): { action: TransitionAction; label: string }[] {
    switch (status) {
      case 'SCHEDULED':
        return [
          { action: 'confirm', label: 'Confirmar' },
          { action: 'start', label: 'Iniciar atendimento' },
          { action: 'no-show', label: 'Marcar falta' },
          { action: 'cancel', label: 'Cancelar' },
        ];
      case 'CONFIRMED':
        return [
          { action: 'start', label: 'Iniciar atendimento' },
          { action: 'no-show', label: 'Marcar falta' },
          { action: 'cancel', label: 'Cancelar' },
        ];
      case 'IN_PROGRESS':
        return [
          { action: 'complete', label: 'Concluir' },
          { action: 'cancel', label: 'Cancelar' },
        ];
      default:
        return [];
    }
  }

  protected async transition(appointment: Appointment, action: TransitionAction): Promise<void> {
    try {
      await this.scheduling.transition(appointment.id, action);
      void this.load();
    } catch {
      this.snackBar.open('Não foi possível atualizar o agendamento.', 'Fechar', { duration: 4000 });
    }
  }

  protected async openBooking(): Promise<void> {
    if (this.members().length === 0) {
      this.members.set(await this.scheduling.members());
    }
    const start = new Date(this.day());
    start.setHours(9, 0, 0, 0);
    const input = await this.dialog
      .open<BookingDialog, BookingDialogData>(BookingDialog, {
        data: { members: this.members(), start },
        width: '520px',
      })
      .afterClosed()
      .toPromise();
    if (!input) {
      return;
    }
    try {
      await this.scheduling.book(input);
      this.snackBar.open('Agendamento criado.', undefined, { duration: 3000 });
      void this.load();
    } catch (err: unknown) {
      const code = (err as { error?: { code?: string } })?.error?.code;
      this.snackBar.open(
        code === 'appointment.overlap'
          ? 'O profissional já tem um agendamento nesse horário.'
          : 'Não foi possível criar o agendamento.',
        'Fechar',
        { duration: 4000 },
      );
    }
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
