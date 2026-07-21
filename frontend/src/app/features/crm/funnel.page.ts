import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Component as NgComponent, inject as ngInject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrmService, Lead, LeadInput, LeadStage } from './crm.service';

const OPEN_STAGES: { stage: LeadStage; label: string }[] = [
  { stage: 'NEW', label: 'Novos' },
  { stage: 'CONTACTED', label: 'Contactados' },
  { stage: 'QUALIFIED', label: 'Qualificados' },
  { stage: 'WON', label: 'Ganhos' },
];

@Component({
  selector: 'app-funnel-page',
  imports: [
    FormsModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  template: `
    <div class="mx-auto max-w-6xl">
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-2xl font-semibold tracking-tight">Funil</h1>
        <button matButton="filled" (click)="openCapture()">
          <mat-icon>add</mat-icon>
          Novo lead
        </button>
      </div>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-4" cdkDropListGroup>
        @for (col of columns; track col.stage) {
          <div class="rounded-xl bg-[color:var(--mat-sys-surface-container)] p-2">
            <div class="mb-2 px-2 text-sm font-medium opacity-70">
              {{ col.label }} ({{ leadsFor(col.stage).length }})
            </div>
            <div
              cdkDropList
              [cdkDropListData]="col.stage"
              (cdkDropListDropped)="drop($event)"
              class="flex min-h-24 flex-col gap-2"
            >
              @for (lead of leadsFor(col.stage); track lead.id) {
                <mat-card appearance="outlined" cdkDrag [cdkDragData]="lead" class="cursor-grab">
                  <mat-card-content class="!py-3">
                    <div class="font-medium">{{ lead.name }}</div>
                    @if (lead.contact) {
                      <div class="text-xs opacity-70">{{ lead.contact }}</div>
                    }
                    @if (lead.source) {
                      <div class="mt-1 text-[10px] uppercase opacity-50">{{ lead.source }}</div>
                    }
                    @if (col.stage !== 'WON') {
                      <button matButton class="!mt-1 !text-xs" (click)="markLost(lead)">
                        Perdido
                      </button>
                    }
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </div>
        }
      </div>

      @if (lostLeads().length > 0) {
        <div class="mt-6">
          <h2 class="mb-2 text-sm font-medium opacity-70">Perdidos ({{ lostLeads().length }})</h2>
          <div class="flex flex-wrap gap-2">
            @for (lead of lostLeads(); track lead.id) {
              <span class="rounded-full border px-3 py-1 text-xs opacity-60 line-through">
                {{ lead.name }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class FunnelPage {
  private readonly crm = inject(CrmService);
  private readonly dialog = inject(MatDialog);

  protected readonly columns = OPEN_STAGES;
  protected readonly leads = signal<Lead[]>([]);
  protected readonly lostLeads = computed(() => this.leads().filter((l) => l.stage === 'LOST'));

  constructor() {
    void this.reload();
  }

  private async reload(): Promise<void> {
    this.leads.set(await this.crm.list());
  }

  protected leadsFor(stage: LeadStage): Lead[] {
    return this.leads().filter((l) => l.stage === stage);
  }

  protected async drop(event: CdkDragDrop<LeadStage>): Promise<void> {
    const lead = event.item.data as Lead;
    const target = event.container.data;
    if (lead.stage === target) {
      return;
    }
    await this.crm.move(lead.id, target);
    await this.reload();
  }

  protected async markLost(lead: Lead): Promise<void> {
    await this.crm.markLost(lead.id, 'Sem interesse');
    await this.reload();
  }

  protected async openCapture(): Promise<void> {
    const input: LeadInput | undefined = await this.dialog
      .open(LeadDialog, { width: '420px' })
      .afterClosed()
      .toPromise();
    if (!input) {
      return;
    }
    await this.crm.capture(input);
    await this.reload();
  }
}

@NgComponent({
  selector: 'app-lead-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Novo lead</h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="!flex flex-col gap-2 min-w-80">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Contato</mat-label>
          <input matInput formControlName="contact" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Origem</mat-label>
          <input matInput formControlName="source" placeholder="Instagram, indicação..." />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close>Cancelar</button>
        <button matButton="filled" type="submit" [disabled]="form.invalid">Salvar</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class LeadDialog {
  private readonly formBuilder = ngInject(FormBuilder);
  private readonly dialogRef = ngInject(MatDialogRef<LeadDialog>);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    contact: [''],
    source: [''],
  });

  protected save(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.getRawValue() satisfies LeadInput);
  }
}
