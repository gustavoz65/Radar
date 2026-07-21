import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Customer, CustomerService } from './customer.service';

export interface AssistantDialogData {
  customer: Customer;
}

/** AI assistant for a customer: quick summary and message drafts (deterministic fallback by default). */
@Component({
  selector: 'app-assistant-dialog',
  imports: [MatDialogModule, MatButtonModule, MatChipsModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title>Assistente · {{ data.customer.name }}</h2>
    <mat-dialog-content class="min-w-96">
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <div class="mb-3 flex flex-wrap gap-2">
        <button matButton="tonal" (click)="summarize()">Resumo</button>
        <button matButton="tonal" (click)="draft('reminder')">Lembrete</button>
        <button matButton="tonal" (click)="draft('return')">Convite de retorno</button>
        <button matButton="tonal" (click)="draft('thanks')">Agradecimento</button>
      </div>

      @if (result()) {
        <div class="rounded-lg border p-3 text-sm whitespace-pre-line">{{ result() }}</div>
        <div class="mt-2 flex items-center gap-2">
          <button matButton (click)="copy()">Copiar</button>
          @if (!aiPowered()) {
            <span class="text-xs opacity-50">gerado localmente (IA não configurada)</span>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton mat-dialog-close>Fechar</button>
    </mat-dialog-actions>
  `,
})
export class AssistantDialog {
  protected readonly data = inject<AssistantDialogData>(MAT_DIALOG_DATA);
  private readonly customerService = inject(CustomerService);

  protected readonly result = signal<string | null>(null);
  protected readonly aiPowered = signal(false);
  protected readonly loading = signal(false);

  protected async summarize(): Promise<void> {
    await this.run(() => this.customerService.summarize(this.data.customer.id));
  }

  protected async draft(kind: string): Promise<void> {
    await this.run(() => this.customerService.draftMessage(kind, this.data.customer.name));
  }

  private async run(action: () => Promise<{ text: string; aiPowered: boolean }>): Promise<void> {
    this.loading.set(true);
    try {
      const res = await action();
      this.result.set(res.text);
      this.aiPowered.set(res.aiPowered);
    } finally {
      this.loading.set(false);
    }
  }

  protected copy(): void {
    const text = this.result();
    if (text) {
      void navigator.clipboard?.writeText(text);
    }
  }
}
