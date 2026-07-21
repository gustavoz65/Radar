import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type AppointmentStatus =
  'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  professionalUserId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  price: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  owner: boolean;
}

export type TransitionAction = 'confirm' | 'start' | 'complete' | 'cancel' | 'no-show';

export interface BookInput {
  customerId: string;
  professionalUserId: string;
  serviceId: string;
  startTime: string;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SchedulingService {
  private readonly http = inject(HttpClient);

  agenda(from: Date, to: Date, professionalId?: string): Promise<Appointment[]> {
    let params = new HttpParams().set('from', from.toISOString()).set('to', to.toISOString());
    if (professionalId) {
      params = params.set('professionalId', professionalId);
    }
    return firstValueFrom(this.http.get<Appointment[]>('/api/v1/appointments', { params }));
  }

  book(input: BookInput): Promise<Appointment> {
    return firstValueFrom(this.http.post<Appointment>('/api/v1/appointments', input));
  }

  transition(id: string, action: TransitionAction): Promise<Appointment> {
    return firstValueFrom(
      this.http.post<Appointment>(`/api/v1/appointments/${id}/transitions/${action}`, {}),
    );
  }

  members(): Promise<Member[]> {
    return firstValueFrom(this.http.get<Member[]>('/api/v1/members'));
  }
}
