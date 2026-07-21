import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface SaleItem {
  id: string;
  kind: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface SalePayment {
  id: string;
  method: string;
  amount: string;
}

export interface Sale {
  id: string;
  customerId: string | null;
  customerName: string | null;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  items: SaleItem[];
  payments: SalePayment[];
  discount: string;
  total: string;
  paid: string;
  createdAt: string;
  completedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly http = inject(HttpClient);

  recent(): Promise<Sale[]> {
    return firstValueFrom(this.http.get<Sale[]>('/api/v1/sales'));
  }

  open(customerId?: string | null): Promise<Sale> {
    return firstValueFrom(
      this.http.post<Sale>('/api/v1/sales', { customerId: customerId ?? null }),
    );
  }

  addService(id: string, serviceId: string, quantity: number): Promise<Sale> {
    return firstValueFrom(
      this.http.post<Sale>(`/api/v1/sales/${id}/service-items`, { serviceId, quantity }),
    );
  }

  addManual(id: string, description: string, quantity: number, unitPrice: string): Promise<Sale> {
    return firstValueFrom(
      this.http.post<Sale>(`/api/v1/sales/${id}/items`, { description, quantity, unitPrice }),
    );
  }

  addPayment(id: string, method: string, amount: string): Promise<Sale> {
    return firstValueFrom(this.http.post<Sale>(`/api/v1/sales/${id}/payments`, { method, amount }));
  }

  complete(id: string): Promise<Sale> {
    return firstValueFrom(this.http.post<Sale>(`/api/v1/sales/${id}/complete`, {}));
  }

  cancel(id: string): Promise<Sale> {
    return firstValueFrom(this.http.post<Sale>(`/api/v1/sales/${id}/cancel`, {}));
  }
}
