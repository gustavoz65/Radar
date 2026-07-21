import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface DayPoint {
  date: string;
  appointments: number;
  revenue: string;
}

export interface AnalyticsSummary {
  totalAppointments: number;
  totalRevenue: string;
  series: DayPoint[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  summary(from: string, to: string): Promise<AnalyticsSummary> {
    const params = new HttpParams().set('from', from).set('to', to);
    return firstValueFrom(this.http.get<AnalyticsSummary>('/api/v1/analytics/summary', { params }));
  }
}
