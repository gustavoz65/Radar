import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SettingsService } from '../../core/tenant/settings.service';

@Component({
  selector: 'app-settings-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="mx-auto max-w-2xl">
      <h1 class="mb-4 text-2xl font-semibold tracking-tight">Configurações</h1>

      <mat-card appearance="outlined">
        <mat-card-content class="py-6">
          <form class="flex flex-col gap-3" [formGroup]="form" (ngSubmit)="save()">
            <h2 class="text-lg font-medium">Identidade visual</h2>
            <div class="flex items-end gap-3">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Cor da marca</mat-label>
                <input matInput formControlName="brandColor" placeholder="#7c3aed" />
              </mat-form-field>
              <input
                type="color"
                [value]="form.controls.brandColor.value"
                (input)="onColor($event)"
                class="mb-5 h-10 w-12 cursor-pointer rounded border"
                aria-label="Seletor de cor"
              />
            </div>
            <mat-form-field appearance="outline">
              <mat-label>URL do logo (opcional)</mat-label>
              <input matInput formControlName="logoUrl" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Tema padrão</mat-label>
              <mat-select formControlName="defaultTheme">
                <mat-option value="system">Sistema</mat-option>
                <mat-option value="light">Claro</mat-option>
                <mat-option value="dark">Escuro</mat-option>
              </mat-select>
            </mat-form-field>

            <h2 class="mt-4 text-lg font-medium">Operação</h2>
            <div class="flex gap-3">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Abertura (h)</mat-label>
                <input matInput type="number" formControlName="openingHour" min="0" max="23" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Fechamento (h)</mat-label>
                <input matInput type="number" formControlName="closingHour" min="1" max="24" />
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline">
              <mat-label>Como você chama seus clientes</mat-label>
              <input
                matInput
                formControlName="customerTerm"
                placeholder="Cliente / Paciente / Aluno"
              />
            </mat-form-field>

            <div class="mt-2 flex justify-end">
              <button matButton="filled" type="submit" [disabled]="form.invalid || saving()">
                Salvar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class SettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly saving = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    brandColor: ['#7c3aed', [Validators.required, Validators.pattern(/^#[0-9a-fA-F]{6}$/)]],
    logoUrl: [''],
    defaultTheme: ['system' as 'system' | 'light' | 'dark'],
    openingHour: [9, [Validators.required, Validators.min(0), Validators.max(23)]],
    closingHour: [19, [Validators.required, Validators.min(1), Validators.max(24)]],
    customerTerm: ['Cliente', [Validators.required, Validators.maxLength(40)]],
  });

  constructor() {
    void this.settingsService
      .load()
      .then((s) => this.form.patchValue({ ...s, logoUrl: s.logoUrl ?? '' }));
  }

  protected onColor(event: Event): void {
    this.form.controls.brandColor.setValue((event.target as HTMLInputElement).value);
  }

  protected async save(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    try {
      const raw = this.form.getRawValue();
      await this.settingsService.save({
        ...raw,
        logoUrl: raw.logoUrl || null,
        openingHour: Number(raw.openingHour),
        closingHour: Number(raw.closingHour),
      });
      this.snackBar.open('Configurações salvas.', undefined, { duration: 3000 });
    } catch {
      this.snackBar.open('Não foi possível salvar.', 'Fechar', { duration: 4000 });
    } finally {
      this.saving.set(false);
    }
  }
}
