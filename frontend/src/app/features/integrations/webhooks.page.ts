import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface Webhook {
  id: string;
  eventType: string;
  url: string;
  secret: string;
  active: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-webhooks-page',
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="mx-auto max-w-3xl">
      <h1 class="mb-1 text-2xl font-semibold tracking-tight">Webhooks</h1>
      <p class="mb-4 text-sm opacity-70">
        Receba eventos do Omnia na sua URL. As entregas são assinadas (HMAC-SHA256) no cabeçalho
        <code>X-Omnia-Signature</code>.
      </p>

      <mat-card appearance="outlined" class="mb-6">
        <mat-card-content class="py-4">
          <div class="flex flex-wrap items-end gap-2">
            <mat-form-field appearance="outline" class="w-48">
              <mat-label>Evento</mat-label>
              <mat-select [(ngModel)]="eventType">
                <mat-option value="appointment.booked">Agendamento criado</mat-option>
                <mat-option value="sale.completed">Venda finalizada</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="min-w-64 flex-1">
              <mat-label>URL</mat-label>
              <input matInput [(ngModel)]="url" placeholder="https://exemplo.com/webhook" />
            </mat-form-field>
            <button matButton="filled" (click)="subscribe()" [disabled]="!url">Assinar</button>
          </div>
        </mat-card-content>
      </mat-card>

      @if (webhooks().length === 0) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          Nenhum webhook configurado.
        </div>
      } @else {
        <div class="flex flex-col gap-2">
          @for (w of webhooks(); track w.id) {
            <mat-card appearance="outlined">
              <mat-card-content class="flex items-center justify-between gap-2 py-3">
                <div class="min-w-0">
                  <div class="font-medium">{{ w.eventType }}</div>
                  <div class="truncate text-sm opacity-70">{{ w.url }}</div>
                  <div class="mt-1 font-mono text-[10px] opacity-50">{{ w.secret }}</div>
                </div>
                <button matIconButton (click)="remove(w)" aria-label="Remover">
                  <mat-icon>delete</mat-icon>
                </button>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class WebhooksPage {
  private readonly http = inject(HttpClient);

  protected readonly webhooks = signal<Webhook[]>([]);
  protected eventType = 'appointment.booked';
  protected url = '';

  constructor() {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.webhooks.set(await firstValueFrom(this.http.get<Webhook[]>('/api/v1/webhooks')));
  }

  protected async subscribe(): Promise<void> {
    if (!this.url) {
      return;
    }
    await firstValueFrom(
      this.http.post('/api/v1/webhooks', { eventType: this.eventType, url: this.url }),
    );
    this.url = '';
    await this.reload();
  }

  protected async remove(webhook: Webhook): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/v1/webhooks/${webhook.id}`));
    await this.reload();
  }
}
