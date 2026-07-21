import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type WorkOrderStatus =
  'OPEN' | 'APPROVED' | 'IN_PROGRESS' | 'DONE' | 'DELIVERED' | 'CANCELLED';

export interface WorkOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface WorkOrder {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  items: WorkOrderItem[];
  total: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private readonly http = inject(HttpClient);

  list(): Promise<WorkOrder[]> {
    return firstValueFrom(this.http.get<WorkOrder[]>('/api/v1/work-orders'));
  }

  open(customerId: string, title: string, description?: string): Promise<WorkOrder> {
    return firstValueFrom(
      this.http.post<WorkOrder>('/api/v1/work-orders', { customerId, title, description }),
    );
  }

  addItem(
    id: string,
    description: string,
    quantity: number,
    unitPrice: string,
  ): Promise<WorkOrder> {
    return firstValueFrom(
      this.http.post<WorkOrder>(`/api/v1/work-orders/${id}/items`, {
        description,
        quantity,
        unitPrice,
      }),
    );
  }

  transition(id: string, status: WorkOrderStatus): Promise<WorkOrder> {
    return firstValueFrom(
      this.http.post<WorkOrder>(`/api/v1/work-orders/${id}/status`, { status }),
    );
  }
}
