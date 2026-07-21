import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface FinanceEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: string;
  dueDate: string;
  status: 'PENDING' | 'SETTLED';
  sourceType: string | null;
}

export interface CashFlow {
  income: string;
  expense: string;
  balance: string;
  pending: string;
}

export interface EntryInput {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: string;
  dueDate: string;
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);

  entries(from: string, to: string): Promise<FinanceEntry[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(this.http.get<FinanceEntry[]>('/api/v1/finance/entries', { params }));
  }

  cashFlow(from: string, to: string): Promise<CashFlow> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(this.http.get<CashFlow>('/api/v1/finance/cash-flow', { params }));
  }

  create(input: EntryInput): Promise<FinanceEntry> {
    return firstValueFrom(this.http.post<FinanceEntry>('/api/v1/finance/entries', input));
  }

  settle(id: string): Promise<FinanceEntry> {
    return firstValueFrom(this.http.post<FinanceEntry>(`/api/v1/finance/entries/${id}/settle`, {}));
  }
}
