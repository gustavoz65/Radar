import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ServiceOffering {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  active: boolean;
}

export interface ServiceInput {
  name: string;
  description?: string | null;
  durationMinutes: number;
  price: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: string;
  cost: string | null;
  active: boolean;
}

export interface ProductInput {
  name: string;
  sku?: string | null;
  price: string;
  cost?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  listServices(includeInactive = false): Promise<ServiceOffering[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return firstValueFrom(this.http.get<ServiceOffering[]>('/api/v1/catalog/services', { params }));
  }

  createService(input: ServiceInput): Promise<ServiceOffering> {
    return firstValueFrom(this.http.post<ServiceOffering>('/api/v1/catalog/services', input));
  }

  updateService(id: string, input: ServiceInput): Promise<ServiceOffering> {
    return firstValueFrom(this.http.put<ServiceOffering>(`/api/v1/catalog/services/${id}`, input));
  }

  toggleService(id: string, active: boolean): Promise<ServiceOffering> {
    return firstValueFrom(
      this.http.patch<ServiceOffering>(`/api/v1/catalog/services/${id}/active`, { active }),
    );
  }

  listProducts(includeInactive = false): Promise<Product[]> {
    const params = new HttpParams().set('includeInactive', includeInactive);
    return firstValueFrom(this.http.get<Product[]>('/api/v1/catalog/products', { params }));
  }

  createProduct(input: ProductInput): Promise<Product> {
    return firstValueFrom(this.http.post<Product>('/api/v1/catalog/products', input));
  }

  updateProduct(id: string, input: ProductInput): Promise<Product> {
    return firstValueFrom(this.http.put<Product>(`/api/v1/catalog/products/${id}`, input));
  }

  toggleProduct(id: string, active: boolean): Promise<Product> {
    return firstValueFrom(
      this.http.patch<Product>(`/api/v1/catalog/products/${id}/active`, { active }),
    );
  }
}
