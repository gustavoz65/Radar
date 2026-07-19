import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';

const VERTICALS = [
  { value: 'BARBERSHOP', label: 'Barbearia' },
  { value: 'BEAUTY_SALON', label: 'Salão de beleza' },
  { value: 'AESTHETIC_CLINIC', label: 'Clínica de estética' },
  { value: 'HEALTH_CLINIC', label: 'Clínica / consultório' },
  { value: 'GYM', label: 'Academia / studio' },
  { value: 'PETSHOP', label: 'Petshop' },
  { value: 'AUTO_REPAIR', label: 'Oficina / assistência' },
  { value: 'REAL_ESTATE', label: 'Imobiliária' },
  { value: 'SERVICES', label: 'Empresa de serviços' },
  { value: 'GENERIC', label: 'Outro' },
];

@Component({
  selector: 'app-signup-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <main class="flex min-h-dvh items-center justify-center p-4">
      <mat-card appearance="outlined" class="w-full max-w-md">
        <mat-card-header class="mb-4 flex-col !items-center gap-1 pt-6">
          <span class="text-2xl font-semibold tracking-tight">Omnia</span>
          <span class="text-sm opacity-70">Crie a conta da sua empresa</span>
        </mat-card-header>
        <mat-card-content>
          <form class="flex flex-col gap-3" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Nome da empresa</mat-label>
              <input matInput formControlName="companyName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Endereço (subdomínio)</mat-label>
              <input matInput formControlName="slug" placeholder="minha-empresa" />
              <mat-hint>letras minúsculas, números e hífens — será seu login</mat-hint>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Segmento</mat-label>
              <mat-select formControlName="vertical">
                @for (v of verticals; track v.value) {
                  <mat-option [value]="v.value">{{ v.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Seu nome</mat-label>
              <input matInput formControlName="ownerName" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Seu e-mail</mat-label>
              <input matInput type="email" formControlName="ownerEmail" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Senha</mat-label>
              <input matInput type="password" formControlName="ownerPassword" />
              <mat-hint>mínimo de 10 caracteres</mat-hint>
            </mat-form-field>

            @if (error()) {
              <p class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error() }}</p>
            }

            <button
              matButton="filled"
              type="submit"
              class="mt-2"
              [disabled]="form.invalid || loading()"
            >
              Criar conta
            </button>
            <a matButton routerLink="/login" class="self-center">Já tenho conta</a>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
})
export class SignupPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly verticals = VERTICALS;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    companyName: ['', [Validators.required, Validators.maxLength(120)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/)]],
    vertical: ['BARBERSHOP', Validators.required],
    ownerName: ['', [Validators.required, Validators.maxLength(120)]],
    ownerEmail: ['', [Validators.required, Validators.email]],
    ownerPassword: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();
    try {
      await firstValueFrom(this.http.post('/api/v1/tenants/signup', value));
      await this.auth.login(value.slug, value.ownerEmail, value.ownerPassword);
      await this.router.navigateByUrl('/dashboard');
    } catch (err: unknown) {
      const code = (err as { error?: { code?: string } })?.error?.code;
      this.error.set(
        code === 'tenant.slug-taken'
          ? 'Este endereço já está em uso — escolha outro subdomínio.'
          : 'Não foi possível criar a conta. Revise os dados e tente novamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
