import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';
import { NotificationService } from '../core/notifications/notification.service';
import { SettingsService } from '../core/tenant/settings.service';

/**
 * Shell da aplicação logada: navegação lateral por módulo + barra superior com tema, sino de
 * notificações e sessão. Carrega as configurações do tenant (aplica a cor da marca) ao entrar.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DatePipe,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatBadgeModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="h-dvh">
      <mat-sidenav mode="side" opened class="w-60 border-r">
        <div class="flex items-center gap-2 p-4 text-lg font-semibold tracking-tight">Omnia</div>
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a
              mat-list-item
              [routerLink]="item.route"
              routerLinkActive="!bg-[color:var(--mat-sys-secondary-container)]"
            >
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="flex flex-col">
        <mat-toolbar class="justify-between gap-2 border-b">
          <span class="text-base font-medium"></span>
          <span class="flex items-center gap-1">
            <button
              matIconButton
              aria-label="Notificações"
              [matMenuTriggerFor]="notifMenu"
              (menuOpened)="refreshNotifications()"
            >
              <mat-icon
                [matBadge]="notifications.unread()"
                [matBadgeHidden]="notifications.unread() === 0"
                matBadgeColor="warn"
                matBadgeSize="small"
              >
                notifications
              </mat-icon>
            </button>
            <mat-menu #notifMenu class="!max-w-sm">
              @if (notifications.items().length === 0) {
                <div class="px-4 py-6 text-center text-sm opacity-60">Nenhuma notificação</div>
              } @else {
                @for (n of notifications.items(); track n.id) {
                  <button
                    mat-menu-item
                    (click)="notifications.markRead(n.id)"
                    [class.opacity-60]="n.read"
                  >
                    <div class="flex flex-col py-1">
                      <span class="text-sm font-medium">{{ n.title }}</span>
                      <span class="text-xs opacity-70">{{ n.body }}</span>
                      <span class="text-[10px] opacity-50">{{
                        n.createdAt | date: 'dd/MM HH:mm'
                      }}</span>
                    </div>
                  </button>
                }
              }
            </mat-menu>

            <button
              matIconButton
              aria-label="Alternar tema"
              (click)="theme.setMode(theme.mode() === 'dark' ? 'light' : 'dark')"
            >
              <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
            <button matButton [matMenuTriggerFor]="userMenu">
              {{ auth.userName() }}
              <mat-icon>expand_more</mat-icon>
            </button>
            <mat-menu #userMenu>
              <a mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                Configurações
              </a>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon>
                Sair
              </button>
            </mat-menu>
          </span>
        </mat-toolbar>

        <main class="flex-1 overflow-auto p-6">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  protected readonly notifications = inject(NotificationService);
  private readonly settings = inject(SettingsService);

  protected readonly navItems = [
    { route: '/dashboard', icon: 'space_dashboard', label: 'Visão geral' },
    { route: '/agenda', icon: 'calendar_month', label: 'Agenda' },
    { route: '/customers', icon: 'group', label: 'Clientes' },
    { route: '/funnel', icon: 'filter_alt', label: 'Funil' },
    { route: '/sales', icon: 'point_of_sale', label: 'Vendas' },
    { route: '/work-orders', icon: 'build', label: 'Ordens de serviço' },
    { route: '/finance', icon: 'payments', label: 'Financeiro' },
    { route: '/catalog', icon: 'sell', label: 'Catálogo' },
    { route: '/inventory', icon: 'inventory_2', label: 'Estoque' },
    { route: '/reports', icon: 'insights', label: 'Relatórios' },
    { route: '/webhooks', icon: 'webhook', label: 'Webhooks' },
  ];

  constructor() {
    void this.settings.load().catch(() => undefined);
    void this.notifications.refresh().catch(() => undefined);
  }

  protected refreshNotifications(): void {
    void this.notifications.refresh().catch(() => undefined);
  }
}
