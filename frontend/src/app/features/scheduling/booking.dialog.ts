import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CustomerService, Customer } from '../customers/customer.service';
import { CatalogService, ServiceOffering } from '../catalog/catalog.service';
import { BookInput, Member } from './scheduling.service';

export interface BookingDialogData {
  members: Member[];
  start: Date;
}

/** New-appointment form: pick customer (search), service and professional for a chosen time. */
@Component({
  selector: 'app-booking-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatAutocompleteModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Novo agendamento</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!flex flex-col gap-2 min-w-96">
        <mat-form-field appearance="outline">
          <mat-label>Cliente</mat-label>
          <input
            matInput
            formControlName="customerQuery"
            [matAutocomplete]="auto"
            placeholder="Buscar cliente"
          />
          <mat-autocomplete
            #auto="matAutocomplete"
            (optionSelected)="pickCustomer($event.option.value)"
          >
            @for (c of customerResults(); track c.id) {
              <mat-option [value]="c">{{ c.name }}{{ c.phone ? ' · ' + c.phone : '' }}</mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Serviço</mat-label>
          <mat-select formControlName="serviceId">
            @for (s of services(); track s.id) {
              <mat-option [value]="s.id">{{ s.name }} ({{ s.durationMinutes }} min)</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Profissional</mat-label>
          <mat-select formControlName="professionalUserId">
            @for (m of data.members; track m.id) {
              <mat-option [value]="m.id">{{ m.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Início</mat-label>
          <input matInput type="datetime-local" formControlName="startTime" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observações</mat-label>
          <textarea matInput rows="2" formControlName="notes"></textarea>
        </mat-form-field>

        @if (error()) {
          <p class="text-sm text-red-600 dark:text-red-400" role="alert">{{ error() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid || !selectedCustomerId()">
          Agendar
        </button>
      </mat-dialog-actions>
    </form>
  `,
})
export class BookingDialog {
  private readonly formBuilder = inject(FormBuilder);
  private readonly customerService = inject(CustomerService);
  private readonly catalogService = inject(CatalogService);
  private readonly dialogRef = inject(MatDialogRef<BookingDialog>);
  protected readonly data = inject<BookingDialogData>(MAT_DIALOG_DATA);

  protected readonly services = signal<ServiceOffering[]>([]);
  protected readonly customerResults = signal<Customer[]>([]);
  protected readonly selectedCustomerId = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.formBuilder.nonNullable.group({
    customerQuery: [''],
    serviceId: ['', Validators.required],
    professionalUserId: [this.data.members[0]?.id ?? '', Validators.required],
    startTime: [toLocalInput(this.data.start), Validators.required],
    notes: [''],
  });

  private readonly query = toSignal(
    this.form.controls.customerQuery.valueChanges.pipe(debounceTime(250), distinctUntilChanged()),
    { initialValue: '' },
  );

  constructor() {
    void this.catalogService.listServices().then((s) => this.services.set(s));

    effect(() => {
      const q = this.query();
      if (typeof q === 'string' && q.length >= 2) {
        void this.customerService
          .search(q, 0, 8)
          .then((page) => this.customerResults.set(page.content));
      } else {
        this.customerResults.set([]);
      }
    });
  }

  protected pickCustomer(customer: Customer): void {
    this.selectedCustomerId.set(customer.id);
    this.form.controls.customerQuery.setValue(customer.name);
  }

  protected save(): void {
    const customerId = this.selectedCustomerId();
    if (this.form.invalid || !customerId) {
      return;
    }
    const raw = this.form.getRawValue();
    this.dialogRef.close({
      customerId,
      serviceId: raw.serviceId,
      professionalUserId: raw.professionalUserId,
      startTime: new Date(raw.startTime).toISOString(),
      notes: raw.notes || null,
    } satisfies BookInput);
  }
}

function toLocalInput(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
