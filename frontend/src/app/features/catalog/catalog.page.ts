import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import {
  CatalogService,
  Product,
  ProductInput,
  ServiceInput,
  ServiceOffering,
} from './catalog.service';
import { ServiceFormDialog } from './service-form.dialog';
import { ProductFormDialog } from './product-form.dialog';

@Component({
  selector: 'app-catalog-page',
  imports: [
    CurrencyPipe,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="mx-auto max-w-4xl">
      <h1 class="mb-4 text-2xl font-semibold tracking-tight">Catálogo</h1>

      <mat-tab-group>
        <mat-tab label="Serviços">
          <div class="flex items-center justify-between py-4">
            <mat-slide-toggle
              [checked]="showInactiveServices()"
              (change)="toggleInactiveServices($event.checked)"
            >
              Mostrar inativos
            </mat-slide-toggle>
            <button matButton="filled" (click)="openService()">
              <mat-icon>add</mat-icon>
              Novo serviço
            </button>
          </div>

          @if (services().length === 0) {
            <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
              Cadastre os serviços que você oferece — eles definem duração e preço na agenda.
            </div>
          } @else {
            <table mat-table [dataSource]="services()" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Serviço</th>
                <td mat-cell *matCellDef="let s" [class.opacity-50]="!s.active">{{ s.name }}</td>
              </ng-container>
              <ng-container matColumnDef="duration">
                <th mat-header-cell *matHeaderCellDef>Duração</th>
                <td mat-cell *matCellDef="let s">{{ s.durationMinutes }} min</td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Preço</th>
                <td mat-cell *matCellDef="let s">{{ +s.price | currency: 'BRL' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let s" class="!text-right">
                  <button matIconButton (click)="openService(s)" aria-label="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    matIconButton
                    (click)="toggleService(s)"
                    [attr.aria-label]="s.active ? 'Desativar' : 'Ativar'"
                  >
                    <mat-icon>{{ s.active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="serviceColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: serviceColumns"></tr>
            </table>
          }
        </mat-tab>

        <mat-tab label="Produtos">
          <div class="flex items-center justify-between py-4">
            <mat-slide-toggle
              [checked]="showInactiveProducts()"
              (change)="toggleInactiveProducts($event.checked)"
            >
              Mostrar inativos
            </mat-slide-toggle>
            <button matButton="filled" (click)="openProduct()">
              <mat-icon>add</mat-icon>
              Novo produto
            </button>
          </div>

          @if (products().length === 0) {
            <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
              Cadastre produtos vendáveis (opcional). O controle de estoque chega numa próxima fase.
            </div>
          } @else {
            <table mat-table [dataSource]="products()" class="w-full">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Produto</th>
                <td mat-cell *matCellDef="let p" [class.opacity-50]="!p.active">{{ p.name }}</td>
              </ng-container>
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>SKU</th>
                <td mat-cell *matCellDef="let p">{{ p.sku || '—' }}</td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Preço</th>
                <td mat-cell *matCellDef="let p">{{ +p.price | currency: 'BRL' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let p" class="!text-right">
                  <button matIconButton (click)="openProduct(p)" aria-label="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    matIconButton
                    (click)="toggleProduct(p)"
                    [attr.aria-label]="p.active ? 'Desativar' : 'Ativar'"
                  >
                    <mat-icon>{{ p.active ? 'toggle_on' : 'toggle_off' }}</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="productColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: productColumns"></tr>
            </table>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class CatalogPage {
  private readonly catalog = inject(CatalogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly serviceColumns = ['name', 'duration', 'price', 'actions'];
  protected readonly productColumns = ['name', 'sku', 'price', 'actions'];

  protected readonly services = signal<ServiceOffering[]>([]);
  protected readonly products = signal<Product[]>([]);
  protected readonly showInactiveServices = signal(false);
  protected readonly showInactiveProducts = signal(false);

  constructor() {
    void this.loadServices();
    void this.loadProducts();
  }

  private async loadServices(): Promise<void> {
    this.services.set(await this.catalog.listServices(this.showInactiveServices()));
  }

  private async loadProducts(): Promise<void> {
    this.products.set(await this.catalog.listProducts(this.showInactiveProducts()));
  }

  protected toggleInactiveServices(checked: boolean): void {
    this.showInactiveServices.set(checked);
    void this.loadServices();
  }

  protected toggleInactiveProducts(checked: boolean): void {
    this.showInactiveProducts.set(checked);
    void this.loadProducts();
  }

  protected async openService(service?: ServiceOffering): Promise<void> {
    const input: ServiceInput | undefined = await this.dialog
      .open(ServiceFormDialog, { data: service ?? null, width: '460px' })
      .afterClosed()
      .toPromise();
    if (!input) {
      return;
    }
    if (service) {
      await this.catalog.updateService(service.id, input);
    } else {
      await this.catalog.createService(input);
    }
    this.snackBar.open('Serviço salvo.', undefined, { duration: 3000 });
    void this.loadServices();
  }

  protected async toggleService(service: ServiceOffering): Promise<void> {
    await this.catalog.toggleService(service.id, !service.active);
    void this.loadServices();
  }

  protected async openProduct(product?: Product): Promise<void> {
    const input: ProductInput | undefined = await this.dialog
      .open(ProductFormDialog, { data: product ?? null, width: '460px' })
      .afterClosed()
      .toPromise();
    if (!input) {
      return;
    }
    if (product) {
      await this.catalog.updateProduct(product.id, input);
    } else {
      await this.catalog.createProduct(input);
    }
    this.snackBar.open('Produto salvo.', undefined, { duration: 3000 });
    void this.loadProducts();
  }

  protected async toggleProduct(product: Product): Promise<void> {
    await this.catalog.toggleProduct(product.id, !product.active);
    void this.loadProducts();
  }
}
