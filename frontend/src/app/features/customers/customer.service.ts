import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface CustomerInput {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface Page<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

export interface AssistantResult {
  text: string;
  aiPowered: boolean;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly http = inject(HttpClient);

  search(q: string, page: number, size: number, includeArchived = false): Promise<Page<Customer>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', page)
      .set('size', size)
      .set('includeArchived', includeArchived);
    return firstValueFrom(this.http.get<Page<Customer>>('/api/v1/customers', { params }));
  }

  create(input: CustomerInput): Promise<Customer> {
    return firstValueFrom(this.http.post<Customer>('/api/v1/customers', input));
  }

  update(id: string, input: CustomerInput): Promise<Customer> {
    return firstValueFrom(this.http.put<Customer>(`/api/v1/customers/${id}`, input));
  }

  archive(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`/api/v1/customers/${id}`));
  }

  restore(id: string): Promise<Customer> {
    return firstValueFrom(this.http.post<Customer>(`/api/v1/customers/${id}/restore`, {}));
  }

  summarize(id: string): Promise<AssistantResult> {
    return firstValueFrom(
      this.http.get<AssistantResult>(`/api/v1/assistant/customers/${id}/summary`),
    );
  }

  draftMessage(kind: string, customerName: string): Promise<AssistantResult> {
    return firstValueFrom(
      this.http.post<AssistantResult>('/api/v1/assistant/draft-message', { kind, customerName }),
    );
  }
}
