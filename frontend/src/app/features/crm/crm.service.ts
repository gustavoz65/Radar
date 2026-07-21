import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type LeadStage = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON' | 'LOST';

export interface Lead {
  id: string;
  name: string;
  contact: string | null;
  source: string | null;
  notes: string | null;
  stage: LeadStage;
  lostReason: string | null;
  createdAt: string;
}

export interface LeadInput {
  name: string;
  contact?: string | null;
  source?: string | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class CrmService {
  private readonly http = inject(HttpClient);

  list(): Promise<Lead[]> {
    return firstValueFrom(this.http.get<Lead[]>('/api/v1/leads'));
  }

  capture(input: LeadInput): Promise<Lead> {
    return firstValueFrom(this.http.post<Lead>('/api/v1/leads', input));
  }

  move(id: string, stage: LeadStage): Promise<Lead> {
    return firstValueFrom(this.http.post<Lead>(`/api/v1/leads/${id}/stage`, { stage }));
  }

  markLost(id: string, reason: string): Promise<Lead> {
    return firstValueFrom(this.http.post<Lead>(`/api/v1/leads/${id}/lost`, { reason }));
  }
}
