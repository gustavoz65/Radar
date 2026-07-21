import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Sale, SalesService } from './sales.service';
import { CatalogService, ServiceOffering } from '../catalog/catalog.service';

/** Comanda: add service/manual lines, register payments, complete or cancel. */
@Component({
  selector: 'app-sale-detail-page',
  imports: [
    CurrencyPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatSnackBarModule,
  ],
  template: `
    @if (sale(); as s) {
      <div class="mx-auto max-w-3xl">
        <div class="mb-4 flex items-center justify-between">
          <h1 class="text-2xl font-semibold tracking-tight">
            Comanda
            <span class="ml-2 text-sm opacity-60">{{ s.customerName || 'Balcão' }}</span>
          </h1>
          <span
            class="rounded-full bg-[color:var(--mat-sys-secondary-container)] px-3 py-1 text-xs"
          >
            {{ statusLabel(s.status) }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <mat-card appearance="outlined" class="md:col-span-2">
            <mat-card-content class="py-4">
              <h2 class="mb-2 font-medium">Itens</h2>
              @if (s.items.length === 0) {
                <p class="text-sm opacity-60">Nenhum item ainda.</p>
              } @else {
                <mat-list>
                  @for (i of s.items; track i.id) {
                    <mat-list-item>
                      <span matListItemTitle>{{ i.quantity }}× {{ i.description }}</span>
                      <span matListItemMeta>{{ +i.lineTotal | currency: 'BRL' }}</span>
                    </mat-list-item>
                  }
                </mat-list>
              }

              @if (s.status === 'OPEN') {
                <div class="mt-4 flex flex-wrap items-end gap-2">
                  <mat-form-field appearance="outline" class="min-w-48 flex-1">
                    <mat-label>Serviço</mat-label>
                    <mat-select [(ngModel)]="selectedService">
                      @for (svc of services(); track svc.id) {
                        <mat-option [value]="svc.id">
                          {{ svc.name }} · {{ +svc.price | currency: 'BRL' }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-20">
                    <mat-label>Qtd</mat-label>
                    <input matInput type="number" min="1" [(ngModel)]="serviceQty" />
                  </mat-form-field>
                  <button matButton="tonal" (click)="addService()" [disabled]="!selectedService">
                    Adicionar
                  </button>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card appearance="outlined">
            <mat-card-content class="py-4">
              <div class="mb-3 flex items-baseline justify-between">
                <span class="opacity-70">Total</span>
                <span class="text-2xl font-semibold">{{ +s.total | currency: 'BRL' }}</span>
              </div>
              <div class="mb-3 flex items-baseline justify-between text-sm">
                <span class="opacity-70">Pago</span>
                <span>{{ +s.paid | currency: 'BRL' }}</span>
              </div>
              <div class="mb-4 flex items-baseline justify-between text-sm">
                <span class="opacity-70">Falta</span>
                <span [class.text-red-600]="remaining() > 0">{{
                  remaining() | currency: 'BRL'
                }}</span>
              </div>

              @if (s.status === 'OPEN') {
                <div class="flex flex-col gap-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Forma</mat-label>
                    <mat-select [(ngModel)]="payMethod">
                      <mat-option value="CASH">Dinheiro</mat-option>
                      <mat-option value="PIX">Pix</mat-option>
                      <mat-option value="CARD">Cartão</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Valor</mat-label>
                    <input matInput type="number" min="0" step="0.01" [(ngModel)]="payAmount" />
                  </mat-form-field>
                  <button matButton="tonal" (click)="addPayment()">Registrar pagamento</button>
                  <button
                    matButton="filled"
                    (click)="complete()"
                    [disabled]="s.items.length === 0 || remaining() > 0"
                  >
                    Finalizar venda
                  </button>
                  <button matButton (click)="cancel()">Cancelar comanda</button>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    }
  `,
})
export class SaleDetailPage {
  readonly id = input.required<string>();

  private readonly salesService = inject(SalesService);
  private readonly catalog = inject(CatalogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  protected readonly sale = signal<Sale | null>(null);
  protected readonly services = signal<ServiceOffering[]>([]);
  protected selectedService = '';
  protected serviceQty = 1;
  protected payMethod = 'CASH';
  protected payAmount: number | null = null;

  protected readonly remaining = computed(() => {
    const s = this.sale();
    return s ? Math.max(0, +s.total - +s.paid) : 0;
  });

  constructor() {
    void this.catalog.listServices().then((svc) => this.services.set(svc));
    queueMicrotask(() => void this.reload());
  }

  private async reload(): Promise<void> {
    const s = await this.salesService.recent();
    const found = s.find((sale) => sale.id === this.id());
    if (found) {
      this.sale.set(found);
    }
  }

  protected statusLabel(status: Sale['status']): string {
    return status === 'OPEN' ? 'Aberta' : status === 'PAID' ? 'Paga' : 'Cancelada';
  }

  protected async addService(): Promise<void> {
    if (!this.selectedService) {
      return;
    }
    this.sale.set(
      await this.salesService.addService(this.id(), this.selectedService, this.serviceQty),
    );
    this.selectedService = '';
    this.serviceQty = 1;
  }

  protected async addPayment(): Promise<void> {
    if (!this.payAmount || this.payAmount <= 0) {
      return;
    }
    this.sale.set(
      await this.salesService.addPayment(this.id(), this.payMethod, String(this.payAmount)),
    );
    this.payAmount = null;
  }

  protected async complete(): Promise<void> {
    try {
      this.sale.set(await this.salesService.complete(this.id()));
      this.snackBar.open('Venda finalizada.', undefined, { duration: 3000 });
    } catch (err: unknown) {
      const code = (err as { error?: { code?: string } })?.error?.code;
      this.snackBar.open(
        code === 'sale.underpaid' ? 'Pagamento insuficiente.' : 'Não foi possível finalizar.',
        'Fechar',
        { duration: 4000 },
      );
    }
  }

  protected async cancel(): Promise<void> {
    await this.salesService.cancel(this.id());
    void this.router.navigateByUrl('/sales');
  }
}
