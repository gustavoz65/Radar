import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

/**
 * Lazy loading por área de negócio, espelhando os módulos do backend (ADR-007).
 * Novos módulos entram como rotas filhas do shell.
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    loadComponent: () => import('./features/auth/signup.page').then((m) => m.SignupPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list.page').then((m) => m.CustomerListPage),
      },
      {
        path: 'catalog',
        loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/scheduling/agenda.page').then((m) => m.AgendaPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
