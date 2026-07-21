import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface StockItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  minQuantity: number;
  belowMinimum: boolean;
}

interface Product {
  id: string;
  name: string;
}

@Component({
  selector: 'app-inventory-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatMenuModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="mx-auto max-w-4xl">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold tracking-tight">Estoque</h1>
        <button matButton="filled" [matMenuTriggerFor]="addMenu">
          <mat-icon>add</mat-icon>
          Controlar produto
        </button>
        <mat-menu #addMenu>
          @for (p of untrackedProducts(); track p.id) {
            <button mat-menu-item (click)="track(p)">{{ p.name }}</button>
          }
          @if (untrackedProducts().length === 0) {
            <div class="px-4 py-2 text-sm opacity-60">Todos os produtos já têm estoque</div>
          }
        </mat-menu>
      </div>

      @if (items().length === 0) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          Cadastre produtos no Catálogo e comece a controlar o estoque aqui.
        </div>
      } @else {
        <table mat-table [dataSource]="items()" class="w-full">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let i">{{ i.productName }}</td>
          </ng-container>
          <ng-container matColumnDef="qty">
            <th mat-header-cell *matHeaderCellDef>Saldo</th>
            <td mat-cell *matCellDef="let i">
              <span [class.text-red-600]="i.belowMinimum" [class.font-semibold]="i.belowMinimum">
                {{ i.quantity }}
              </span>
              @if (i.belowMinimum) {
                <mat-icon class="!text-base align-middle text-red-600">warning</mat-icon>
              }
            </td>
          </ng-container>
          <ng-container matColumnDef="min">
            <th mat-header-cell *matHeaderCellDef>Mínimo</th>
            <td mat-cell *matCellDef="let i">{{ i.minQuantity }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let i" class="!text-right">
              <button matButton="tonal" (click)="move(i, 'IN')">+ Entrada</button>
              <button matButton (click)="move(i, 'OUT')">− Saída</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
})
export class InventoryPage {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly items = signal<StockItem[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly columns = ['name', 'qty', 'min', 'actions'];

  constructor() {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.items.set(await firstValueFrom(this.http.get<StockItem[]>('/api/v1/inventory/items')));
    this.products.set(await firstValueFrom(this.http.get<Product[]>('/api/v1/catalog/products')));
  }

  protected untrackedProducts(): Product[] {
    const tracked = new Set(this.items().map((i) => i.productId));
    return this.products().filter((p) => !tracked.has(p.id));
  }

  protected async track(product: Product): Promise<void> {
    await firstValueFrom(
      this.http.post('/api/v1/inventory/items', {
        productId: product.id,
        productName: product.name,
        minQuantity: 0,
      }),
    );
    await this.reload();
  }

  protected async move(item: StockItem, type: 'IN' | 'OUT'): Promise<void> {
    const input = window.prompt(
      `Quantidade (${type === 'IN' ? 'entrada' : 'saída'}) para ${item.productName}:`,
      '1',
    );
    const amount = Number(input);
    if (!amount || amount <= 0) {
      return;
    }
    try {
      await firstValueFrom(
        this.http.post(`/api/v1/inventory/items/${item.id}/movements`, {
          type,
          amount,
          reason: type === 'IN' ? 'Entrada manual' : 'Saída manual',
        }),
      );
      await this.reload();
    } catch {
      this.snackBar.open('Movimentação inválida (estoque insuficiente?).', 'Fechar', {
        duration: 4000,
      });
    }
  }
}
