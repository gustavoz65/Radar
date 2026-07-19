import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <main class="flex min-h-dvh items-center justify-center p-4">
      <mat-card appearance="outlined" class="w-full max-w-sm">
        <mat-card-header class="mb-4 flex-col !items-center gap-1 pt-6">
          <span class="text-2xl font-semibold tracking-tight">Omnia</span>
          <span class="text-sm opacity-70">Entre na sua conta</span>
        </mat-card-header>
        <mat-card-content>
          <form class="flex flex-col gap-3" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Empresa (subdomínio)</mat-label>
              <input matInput formControlName="tenantSlug" autocomplete="organization" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Senha</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
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
              @if (loading()) {
                <mat-spinner diameter="20" class="mr-2 inline-block" />
              }
              Entrar
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
})
export class LoginPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    tenantSlug: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { tenantSlug, email, password } = this.form.getRawValue();
    try {
      await this.auth.login(tenantSlug, email, password);
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.error.set('Credenciais inválidas. Verifique empresa, e-mail e senha.');
    } finally {
      this.loading.set(false);
    }
  }
}
