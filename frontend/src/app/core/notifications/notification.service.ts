import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  items: AppNotification[];
  unread: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);

  readonly items = signal<AppNotification[]>([]);
  readonly unread = signal(0);

  async refresh(): Promise<void> {
    const res = await firstValueFrom(this.http.get<NotificationsResponse>('/api/v1/notifications'));
    this.items.set(res.items);
    this.unread.set(res.unread);
  }

  async markRead(id: string): Promise<void> {
    await firstValueFrom(this.http.post(`/api/v1/notifications/${id}/read`, {}));
    await this.refresh();
  }
}
