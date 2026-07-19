import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { effect } from '@angular/core';
import { Customer, CustomerInput, CustomerService } from './customer.service';
import { CustomerFormDialog } from './customer-form.dialog';

@Component({
  selector: 'app-customer-list-page',
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="mx-auto max-w-5xl">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p class="text-sm opacity-70">{{ total() }} cliente(s)</p>
        </div>
        <button matButton="filled" (click)="openForm()">
          <mat-icon>person_add</mat-icon>
          Novo cliente
        </button>
      </div>

      <div class="mb-2 flex flex-wrap items-center gap-4">
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="grow max-w-md">
          <mat-icon matPrefix>search</mat-icon>
          <input
            matInput
            placeholder="Buscar por nome, e-mail ou telefone"
            [formControl]="searchControl"
          />
        </mat-form-field>
        <mat-slide-toggle [checked]="includeArchived()" (change)="toggleArchived($event.checked)">
          Mostrar arquivados
        </mat-slide-toggle>
      </div>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (rows().length === 0 && !loading()) {
        <div class="rounded-xl border border-dashed p-10 text-center opacity-70">
          @if (searchControl.value) {
            Nenhum cliente encontrado para "{{ searchControl.value }}".
          } @else {
            Sua base de clientes começa aqui — cadastre o primeiro no botão "Novo cliente".
          }
        </div>
      } @else {
        <table mat-table [dataSource]="rows()" class="w-full rounded-xl overflow-hidden">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let c">
              <span
                [class.line-through]="c.status === 'ARCHIVED'"
                [class.opacity-50]="c.status === 'ARCHIVED'"
              >
                {{ c.name }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let c">{{ c.email || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>Telefone</th>
            <td mat-cell *matCellDef="let c">{{ c.phone || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Cadastro</th>
            <td mat-cell *matCellDef="let c">{{ c.createdAt | date: 'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let c" class="!text-right">
              <button matIconButton [matMenuTriggerFor]="rowMenu" aria-label="Ações">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #rowMenu>
                <button mat-menu-item (click)="openForm(c)">
                  <mat-icon>edit</mat-icon>
                  Editar
                </button>
                @if (c.status === 'ACTIVE') {
                  <button mat-menu-item (click)="archive(c)">
                    <mat-icon>archive</mat-icon>
                    Arquivar
                  </button>
                } @else {
                  <button mat-menu-item (click)="restore(c)">
                    <mat-icon>unarchive</mat-icon>
                    Restaurar
                  </button>
                }
              </mat-menu>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>

        <mat-paginator
          [length]="total()"
          [pageIndex]="pageIndex()"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)"
        />
      }
    </div>
  `,
})
export class CustomerListPage {
  private readonly service = inject(CustomerService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly columns = ['name', 'email', 'phone', 'createdAt', 'actions'];
  protected readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(
    this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly rows = signal<Customer[]>([]);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(20);
  protected readonly includeArchived = signal(false);
  protected readonly loading = signal(false);

  constructor() {
    effect(() => {
      // recarrega quando busca/página/filtro mudam
      const q = this.query();
      const page = this.pageIndex();
      const size = this.pageSize();
      const archived = this.includeArchived();
      void this.load(q, page, size, archived);
    });
  }

  private async load(q: string, page: number, size: number, archived: boolean): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.service.search(q, page, size, archived);
      this.rows.set(result.content);
      this.total.set(result.page.totalElements);
    } catch {
      this.snackBar.open('Erro ao carregar clientes.', 'Fechar', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  protected onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  protected toggleArchived(checked: boolean): void {
    this.includeArchived.set(checked);
    this.pageIndex.set(0);
  }

  protected async openForm(customer?: Customer): Promise<void> {
    const input: CustomerInput | undefined = await this.dialog
      .open(CustomerFormDialog, { data: customer ?? null, width: '480px' })
      .afterClosed()
      .toPromise();
    if (!input) {
      return;
    }
    try {
      if (customer) {
        await this.service.update(customer.id, input);
        this.snackBar.open('Cliente atualizado.', undefined, { duration: 3000 });
      } else {
        await this.service.create(input);
        this.snackBar.open('Cliente cadastrado.', undefined, { duration: 3000 });
      }
      this.refresh();
    } catch {
      this.snackBar.open('Não foi possível salvar o cliente.', 'Fechar', { duration: 4000 });
    }
  }

  protected async archive(customer: Customer): Promise<void> {
    await this.service.archive(customer.id);
    this.snackBar.open(`${customer.name} arquivado.`, undefined, { duration: 3000 });
    this.refresh();
  }

  protected async restore(customer: Customer): Promise<void> {
    await this.service.restore(customer.id);
    this.snackBar.open(`${customer.name} restaurado.`, undefined, { duration: 3000 });
    this.refresh();
  }

  private refresh(): void {
    void this.load(this.query(), this.pageIndex(), this.pageSize(), this.includeArchived());
  }
}
