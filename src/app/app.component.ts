import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastContainerComponent } from './shared/toast/toast-container.component';
import { TrainerStore } from './state/trainer.store';
import { TrainerSelectors } from './state/trainer.selectors';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Root application shell component.
 * Contains sidebar navigation, header with trainer info,
 * router outlet, and toast notification container.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  template: `
    <div class="app-shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <span class="logo" [class.collapsed]="sidebarCollapsed()">
            @if (!sidebarCollapsed()) {
              <span class="logo-icon">◓</span>
              <span class="logo-text">Pokédex</span>
            } @else {
              <span class="logo-icon">◓</span>
            }
          </span>
          <button class="sidebar-toggle" (click)="sidebarCollapsed.set(!sidebarCollapsed())" id="sidebar-toggle">
            {{ sidebarCollapsed() ? '→' : '←' }}
          </button>
        </div>
        <div class="nav-links">
          <a routerLink="/pokedex" routerLinkActive="active" class="nav-link" id="nav-pokedex">
            <span class="nav-icon">📖</span>
            @if (!sidebarCollapsed()) { <span class="nav-label">Pokédex</span> }
          </a>
          <a routerLink="/team-builder" routerLinkActive="active" class="nav-link" id="nav-team-builder">
            <span class="nav-icon">⚔️</span>
            @if (!sidebarCollapsed()) { <span class="nav-label">Team Builder</span> }
          </a>
          <a routerLink="/battles" routerLinkActive="active" class="nav-link" id="nav-battles">
            <span class="nav-icon">🏆</span>
            @if (!sidebarCollapsed()) { <span class="nav-label">Battles</span> }
          </a>
          <a routerLink="/profile" routerLinkActive="active" class="nav-link" id="nav-profile">
            <span class="nav-icon">👤</span>
            @if (!sidebarCollapsed()) { <span class="nav-label">Profile</span> }
          </a>
        </div>
        @if (!sidebarCollapsed() && trainer()) {
          <div class="sidebar-footer">
            <span class="trainer-name">{{ trainer()!.name }}</span>
            <span class="trainer-rank">{{ trainer()!.rank }}</span>
          </div>
        }
      </nav>

      <!-- Main Content -->
      <main class="main-content" id="main-content">
        <router-outlet />
      </main>

      <app-toast-container />
    </div>
  `,
  styles: [`
    .app-shell { display: flex; min-height: 100vh; background: var(--bg-primary); color: var(--text-primary); }

    .sidebar { width: 240px; background: var(--sidebar-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; transition: width 0.3s ease; position: fixed; top: 0; bottom: 0; z-index: 50; }
    .sidebar-collapsed .sidebar { width: 64px; }

    .sidebar-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 16px; border-bottom: 1px solid var(--border-color); }
    .logo { display: flex; align-items: center; gap: 8px; }
    .logo-icon { font-size: 1.5rem; }
    .logo-text { font-size: 1.1rem; font-weight: 800; background: linear-gradient(135deg, #ef4444, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .sidebar-toggle { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.9rem; padding: 4px; }

    .nav-links { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 4px; }
    .nav-link { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; font-weight: 500; transition: all 0.2s; }
    .nav-link:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
    .nav-link.active { background: rgba(99,102,241,0.15); color: var(--accent); font-weight: 600; }
    .nav-icon { font-size: 1.1rem; }
    .sidebar-collapsed .nav-link { justify-content: center; padding: 12px; }

    .sidebar-footer { padding: 16px; border-top: 1px solid var(--border-color); }
    .trainer-name { display: block; font-weight: 600; font-size: 0.85rem; }
    .trainer-rank { font-size: 0.7rem; color: var(--text-secondary); }

    .main-content { flex: 1; margin-left: 240px; padding: 32px; min-height: 100vh; transition: margin-left 0.3s ease; }
    .sidebar-collapsed .main-content { margin-left: 64px; }

    @media (max-width: 768px) {
      .sidebar { width: 64px; }
      .main-content { margin-left: 64px; padding: 16px; }
    }
  `],
})
export class AppComponent {
  private readonly trainerStore = inject(TrainerStore);
  private readonly trainerSelectors = inject(TrainerSelectors);

  /** Signal controlling sidebar collapsed state */
  readonly sidebarCollapsed = signal(false);

  /** Current trainer data bridged from store selector */
  readonly trainer = toSignal(this.trainerSelectors.currentTrainer$);

  constructor() {
    // Load initial data from local server
    this.trainerStore.loadTrainers();
    this.trainerStore.loadTeams();
    this.trainerStore.loadBattles();
    this.trainerStore.loadBattleLog();

    // Restore trainer from localStorage
    const savedTrainerId = localStorage.getItem('currentTrainerId');
    if (savedTrainerId) {
      this.trainerStore.setCurrentTrainer(parseInt(savedTrainerId, 10));
    }

    // Effect: persist selected trainer to localStorage
    effect(() => {
      const state = this.trainerStore.state;
      localStorage.setItem('currentTrainerId', String(state.currentTrainerId));
    });
  }
}
