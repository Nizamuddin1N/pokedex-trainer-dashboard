import { Routes } from '@angular/router';

/**
 * Application routes with lazy-loaded feature components.
 * Each route loads its component on demand for optimal bundle size.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'pokedex', pathMatch: 'full' },
  {
    path: 'pokedex',
    loadComponent: () => import('./features/pokedex/pokedex.component'),
    title: 'Pokédex — Trainer Dashboard',
  },
  {
    path: 'team-builder',
    loadComponent: () => import('./features/team-builder/team-builder.component'),
    title: 'Team Builder — Trainer Dashboard',
  },
  {
    path: 'battles',
    loadComponent: () => import('./features/battle-log/battle-log.component'),
    title: 'Battle Log — Trainer Dashboard',
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/trainer-profile/trainer-profile.component'),
    title: 'Trainer Profile — Trainer Dashboard',
  },
];
