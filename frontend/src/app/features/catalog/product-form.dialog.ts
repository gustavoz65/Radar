import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Product, ProductInput } from './catalog.service';

@Component({
  selector: 'app-product-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar produto' : 'Novo produto' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!flex flex-col gap-2 min-w-80">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>SKU / código</mat-label>
          <input matInput formControlName="sku" />
        </mat-form-field>
        <div class="flex gap-2">
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Preço (R$)</mat-label>
            <input matInput type="number" formControlName="price" min="0" step="0.01" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="flex-1">
            <mat-label>Custo (R$)</mat-label>
            <input matInput type="number" formControlName="cost" min="0" step="0.01" />
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
export class ProductFormDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductFormDialog>);
  protected readonly data = inject<Product | null>(MAT_DIALOG_DATA);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(160)]],
    sku: [this.data?.sku ?? ''],
    price: [this.data?.price ?? '0.00', Validators.required],
    cost: [this.data?.cost ?? ''],
  });

  protected save(): void {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      name: raw.name,
      sku: raw.sku || null,
      price: String(raw.price),
      cost: raw.cost ? String(raw.cost) : null,
    } satisfies ProductInput);
  }
}
