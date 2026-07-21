import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { CashFlow, EntryInput, FinanceEntry, FinanceService } from './finance.service';

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

@Component({
  selector: 'app-finance-page',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
  ],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold tracking-tight">Financeiro</h1>
        <button matButton="filled" (click)="openEntry()">
          <mat-icon>add</mat-icon>
          Novo lançamento
        </button>
      </div>

      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <mat-card appearance="outlined">
          <mat-card-content class="py-4">
            <div class="text-sm opacity-70">Entradas (mês)</div>
            <div class="text-2xl font-semibold text-emerald-600">
              {{ +(flow()?.income ?? 0) | currency: 'BRL' }}
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-content class="py-4">
            <div class="text-sm opacity-70">Saídas (mês)</div>
            <div class="text-2xl font-semibold text-red-600">
              {{ +(flow()?.expense ?? 0) | currency: 'BRL' }}
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card appearance="outlined">
          <mat-card-content class="py-4">
            <div class="text-sm opacity-70">Saldo</div>
            <div class="text-2xl font-semibold">
              {{ +(flow()?.balance ?? 0) | currency: 'BRL' }}
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      @if (entries().length === 0) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          Sem lançamentos neste mês. Vendas finalizadas viram entradas automaticamente.
        </div>
      } @else {
        <table mat-table [dataSource]="entries()" class="w-full">
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
            <td mat-cell *matCellDef="let e">
              {{ e.description }}
              <span class="opacity-50">· {{ e.category }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="amount">
            <th mat-header-cell *matHeaderCellDef>Valor</th>
            <td
              mat-cell
              *matCellDef="let e"
              [class.text-emerald-600]="e.type === 'INCOME'"
              [class.text-red-600]="e.type === 'EXPENSE'"
            >
              {{ e.type === 'EXPENSE' ? '-' : '+' }}{{ +e.amount | currency: 'BRL' }}
            </td>
          </ng-container>
          <ng-container matColumnDef="due">
            <th mat-header-cell *matHeaderCellDef>Vencimento</th>
            <td mat-cell *matCellDef="let e">{{ e.dueDate | date: 'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let e">
              @if (e.status === 'SETTLED') {
                <span class="text-emerald-600">Liquidado</span>
              } @else {
                <button matButton="tonal" (click)="settle(e)">Liquidar</button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
})
export class FinancePage {
  private readonly finance = inject(FinanceService);
  private readonly dialog = inject(MatDialog);

  protected readonly entries = signal<FinanceEntry[]>([]);
  protected readonly flow = signal<CashFlow | null>(null);
  protected readonly columns = ['description', 'amount', 'due', 'status'];
  private readonly range = monthRange();

  constructor() {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.entries.set(await this.finance.entries(this.range.from, this.range.to));
    this.flow.set(await this.finance.cashFlow(this.range.from, this.range.to));
  }

  protected async settle(entry: FinanceEntry): Promise<void> {
    await this.finance.settle(entry.id);
    void this.reload();
  }

  protected async openEntry(): Promise<void> {
    const input: EntryInput | undefined = await this.dialog
      .open(EntryDialog, { width: '420px' })
      .afterClosed()
      .toPromise();
    if (!input) {
      return;
    }
    await this.finance.create(input);
    void this.reload();
  }
}

@Component({
  selector: 'app-entry-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Novo lançamento</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!flex flex-col gap-2 min-w-80">
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            <mat-option value="INCOME">Entrada</mat-option>
            <mat-option value="EXPENSE">Saída</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Categoria</mat-label>
          <input matInput formControlName="category" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <input matInput formControlName="description" />
        </mat-form-field>
        <div class="flex gap-2">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Valor</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="amount" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Vencimento</mat-label>
            <input matInput type="date" formControlName="dueDate" />
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid">Salvar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class EntryDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EntryDialog>);

  protected readonly form = this.formBuilder.nonNullable.group({
    type: ['EXPENSE' as 'INCOME' | 'EXPENSE', Validators.required],
    category: ['', Validators.required],
    description: ['', Validators.required],
    amount: ['', Validators.required],
    dueDate: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  protected save(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({ ...raw, amount: String(raw.amount) } satisfies EntryInput);
  }
}
