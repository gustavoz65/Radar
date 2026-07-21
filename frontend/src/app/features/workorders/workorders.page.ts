import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Component as NgComponent, inject as ngInject, signal as ngSignal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { WorkOrder, WorkOrderService, WorkOrderStatus } from './workorder.service';
import { CustomerService, Customer } from '../customers/customer.service';

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  OPEN: 'Aberta',
  APPROVED: 'Aprovada',
  IN_PROGRESS: 'Em execução',
  DONE: 'Concluída',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelada',
};

const NEXT: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  OPEN: ['APPROVED', 'CANCELLED'],
  APPROVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

@Component({
  selector: 'app-workorders-page',
  imports: [
    CurrencyPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
  ],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold tracking-tight">Ordens de serviço</h1>
        <button matButton="filled" (click)="openNew()">
          <mat-icon>build</mat-icon>
          Nova OS
        </button>
      </div>

      @if (orders().length === 0) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          Abra uma OS para controlar serviços com peças, aprovação e status.
        </div>
      } @else {
        <div class="flex flex-col gap-3">
          @for (o of orders(); track o.id) {
            <mat-card appearance="outlined">
              <mat-card-content class="py-4">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-medium">{{ o.title }}</div>
                    <div class="text-sm opacity-70">{{ o.customerName }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-semibold">{{ +o.total | currency: 'BRL' }}</div>
                    <span class="text-xs opacity-70">{{ statusLabel(o.status) }}</span>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button matButton="tonal" (click)="addItem(o)" [disabled]="!canEdit(o)">
                    Adicionar item
                  </button>
                  @for (n of nextFor(o.status); track n) {
                    <button matButton (click)="transition(o, n)">→ {{ statusLabel(n) }}</button>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
})
export class WorkOrdersPage {
  private readonly service = inject(WorkOrderService);
  private readonly dialog = inject(MatDialog);

  protected readonly orders = signal<WorkOrder[]>([]);

  constructor() {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.orders.set(await this.service.list());
  }

  protected statusLabel(status: WorkOrderStatus): string {
    return STATUS_LABEL[status];
  }

  protected nextFor(status: WorkOrderStatus): WorkOrderStatus[] {
    return NEXT[status];
  }

  protected canEdit(order: WorkOrder): boolean {
    return ['OPEN', 'APPROVED', 'IN_PROGRESS'].includes(order.status);
  }

  protected async transition(order: WorkOrder, status: WorkOrderStatus): Promise<void> {
    await this.service.transition(order.id, status);
    await this.reload();
  }

  protected async addItem(order: WorkOrder): Promise<void> {
    const res: { description: string; quantity: number; unitPrice: string } | undefined =
      await this.dialog.open(ItemDialog, { width: '400px' }).afterClosed().toPromise();
    if (!res) {
      return;
    }
    await this.service.addItem(order.id, res.description, res.quantity, res.unitPrice);
    await this.reload();
  }

  protected async openNew(): Promise<void> {
    const res: { customerId: string; title: string; description: string } | undefined =
      await this.dialog.open(NewOrderDialog, { width: '460px' }).afterClosed().toPromise();
    if (!res) {
      return;
    }
    await this.service.open(res.customerId, res.title, res.description);
    await this.reload();
  }
}

@NgComponent({
  selector: 'app-wo-item-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Novo item</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!flex flex-col gap-2 min-w-80">
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <input matInput formControlName="description" required />
        </mat-form-field>
        <div class="flex gap-2">
          <mat-form-field appearance="outline" class="w-24">
            <mat-label>Qtd</mat-label>
            <input matInput type="number" min="1" formControlName="quantity" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Preço unit.</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="unitPrice" />
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid">Adicionar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class ItemDialog {
  private readonly fb = ngInject(FormBuilder);
  private readonly ref = ngInject(MatDialogRef<ItemDialog>);
  protected readonly form = this.fb.nonNullable.group({
    description: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: ['0.00', Validators.required],
  });
  protected save(): void {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    this.ref.close({ ...raw, quantity: Number(raw.quantity), unitPrice: String(raw.unitPrice) });
  }
}

@NgComponent({
  selector: 'app-wo-new-dialog',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Nova ordem de serviço</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!flex flex-col gap-2 min-w-96">
        <mat-form-field appearance="outline">
          <mat-label>Cliente</mat-label>
          <input
            matInput
            [matAutocomplete]="auto"
            [(ngModel)]="customerQuery"
            [ngModelOptions]="{ standalone: true }"
            (ngModelChange)="searchCustomers($event)"
          />
          <mat-autocomplete #auto (optionSelected)="pick($event.option.value)">
            @for (c of customers(); track c.id) {
              <mat-option [value]="c">{{ c.name }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Título</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Descrição</mat-label>
          <textarea matInput rows="2" formControlName="description"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid || !customerId()">
          Abrir OS
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class NewOrderDialog {
  private readonly fb = ngInject(FormBuilder);
  private readonly ref = ngInject(MatDialogRef<NewOrderDialog>);
  private readonly customerService = ngInject(CustomerService);

  protected customerQuery = '';
  protected readonly customers = ngSignal<Customer[]>([]);
  protected readonly customerId = ngSignal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
  });

  protected async searchCustomers(q: string): Promise<void> {
    if (q && q.length >= 2) {
      const page = await this.customerService.search(q, 0, 8);
      this.customers.set(page.content);
    }
  }

  protected pick(customer: Customer): void {
    this.customerId.set(customer.id);
    this.customerQuery = customer.name;
  }

  protected save(): void {
    if (this.form.invalid || !this.customerId()) return;
    this.ref.close({ customerId: this.customerId()!, ...this.form.getRawValue() });
  }
}
