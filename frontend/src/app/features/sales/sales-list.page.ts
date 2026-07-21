import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Sale, SalesService } from './sales.service';

@Component({
  selector: 'app-sales-list-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold tracking-tight">Vendas</h1>
        <button matButton="filled" (click)="newSale()">
          <mat-icon>point_of_sale</mat-icon>
          Nova comanda
        </button>
      </div>

      @if (sales().length === 0) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          Abra uma comanda para registrar uma venda de serviços ou produtos.
        </div>
      } @else {
        <table mat-table [dataSource]="sales()" class="w-full">
          <ng-container matColumnDef="customer">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let s">{{ s.customerName || 'Balcão' }}</td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let s">{{ +s.total | currency: 'BRL' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let s">{{ statusLabel(s.status) }}</td>
          </ng-container>
          <ng-container matColumnDef="date">
            <th mat-header-cell *matHeaderCellDef>Data</th>
            <td mat-cell *matCellDef="let s">{{ s.createdAt | date: 'dd/MM HH:mm' }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: columns"
            [routerLink]="['/sales', row.id]"
            class="cursor-pointer"
          ></tr>
        </table>
      }
    </div>
  `,
})
export class SalesListPage {
  private readonly salesService = inject(SalesService);
  private readonly router = inject(Router);

  protected readonly sales = signal<Sale[]>([]);
  protected readonly columns = ['customer', 'total', 'status', 'date'];

  constructor() {
    void this.salesService.recent().then((s) => this.sales.set(s));
  }

  protected statusLabel(status: Sale['status']): string {
    return status === 'OPEN' ? 'Aberta' : status === 'PAID' ? 'Paga' : 'Cancelada';
  }

  protected async newSale(): Promise<void> {
    const sale = await this.salesService.open();
    void this.router.navigate(['/sales', sale.id]);
  }
}
