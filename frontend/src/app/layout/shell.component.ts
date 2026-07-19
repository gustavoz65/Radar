import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../core/auth/auth.service';
import { ThemeService } from '../core/theme/theme.service';

/**
 * Shell da aplicação logada: navegação lateral por módulo (itens surgem conforme módulos
 * habilitados do tenant — hoje só o dashboard) + barra superior com tema e sessão.
 */
@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
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

  protected readonly navItems = [
    { route: '/dashboard', icon: 'space_dashboard', label: 'Visão geral' },
  ];
}
