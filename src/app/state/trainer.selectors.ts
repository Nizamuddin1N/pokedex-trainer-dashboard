import { Injectable, inject } from '@angular/core';
import { Observable, map, distinctUntilChanged, combineLatest, shareReplay } from 'rxjs';
import { TrainerStore } from './trainer.store';
import { Trainer, Team, Battle, BattleLogEntry } from '../models/trainer.model';

/**
 * Derived observable selectors for the trainer store.
 * Provides computed data like win rates, team stats,
 * battle history breakdowns, and monthly aggregations.
 */
@Injectable({ providedIn: 'root' })
export class TrainerSelectors {
  /** Reference to the trainer store */
  private readonly store = inject(TrainerStore);

  /**
   * Observable of the currently active trainer profile.
   *
   * @returns Observable<Trainer | undefined> - Current trainer or undefined
   */
  readonly currentTrainer$: Observable<Trainer | undefined> = this.store.state$.pipe(
    map(s => s.trainers.find(t => t.id === s.currentTrainerId)),
    distinctUntilChanged()
  );

  /**
   * Observable of all trainers.
   *
   * @returns Observable<Trainer[]> - All trainers
   */
  readonly trainers$: Observable<Trainer[]> = this.store.state$.pipe(
    map(s => s.trainers),
    distinctUntilChanged()
  );

  /**
   * Observable of teams belonging to the current trainer.
   *
   * @returns Observable<Team[]> - Current trainer's teams
   */
  readonly currentTrainerTeams$: Observable<Team[]> = this.store.state$.pipe(
    map(s => s.teams.filter(t => t.trainer_id === s.currentTrainerId)),
    distinctUntilChanged(),
    shareReplay(1)
  );

  /**
   * Observable of all teams.
   *
   * @returns Observable<Team[]> - All teams
   */
  readonly allTeams$: Observable<Team[]> = this.store.state$.pipe(
    map(s => s.teams),
    distinctUntilChanged()
  );

  /**
   * Observable of battles belonging to the current trainer.
   *
   * @returns Observable<Battle[]> - Current trainer's battles
   */
  readonly currentTrainerBattles$: Observable<Battle[]> = this.store.state$.pipe(
    map(s => s.battles.filter(b => b.trainer_id === s.currentTrainerId)),
    distinctUntilChanged(),
    shareReplay(1)
  );

  /**
   * Observable of the current trainer's win rate as a percentage.
   * Returns 0 if no battles have been fought.
   *
   * @returns Observable<number> - Win rate percentage (0-100)
   */
  readonly winRate$: Observable<number> = this.currentTrainerBattles$.pipe(
    map(battles => {
      if (!battles.length) return 0;
      const wins = battles.filter(b => b.result === 'win').length;
      return Math.round((wins / battles.length) * 100);
    }),
    distinctUntilChanged(),
    shareReplay(1)
  );

  /**
   * Observable of win/loss counts for the current trainer.
   *
   * @returns Observable<{ wins: number; losses: number; total: number }> - Battle stats
   */
  readonly battleStats$: Observable<{ wins: number; losses: number; total: number }> = this.currentTrainerBattles$.pipe(
    map(battles => ({
      wins: battles.filter(b => b.result === 'win').length,
      losses: battles.filter(b => b.result === 'loss').length,
      total: battles.length,
    })),
    distinctUntilChanged((a, b) => a.wins === b.wins && a.losses === b.losses),
    shareReplay(1)
  );

  /**
   * Observable of monthly battle breakdown for chart rendering.
   * Groups battles by month and counts wins vs losses.
   *
   * @returns Observable of monthly data array with month label, wins, and losses
   */
  readonly monthlyBattles$: Observable<{ month: string; wins: number; losses: number }[]> = this.currentTrainerBattles$.pipe(
    map(battles => {
      const months = new Map<string, { wins: number; losses: number }>();
      battles.forEach(b => {
        const d = new Date(b.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!months.has(key)) months.set(key, { wins: 0, losses: 0 });
        const entry = months.get(key)!;
        if (b.result === 'win') entry.wins++;
        else if (b.result === 'loss') entry.losses++;
      });

      return Array.from(months.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => ({
          month: this.formatMonth(month),
          ...data,
        }));
    }),
    shareReplay(1)
  );

  /**
   * Observable of all battle log entries.
   *
   * @returns Observable<BattleLogEntry[]> - Battle log feed
   */
  readonly battleLog$: Observable<BattleLogEntry[]> = this.store.state$.pipe(
    map(s => s.battleLog),
    distinctUntilChanged()
  );

  /**
   * Observable of the loading state.
   *
   * @returns Observable<boolean> - Loading status
   */
  readonly loading$: Observable<boolean> = this.store.state$.pipe(
    map(s => s.loading),
    distinctUntilChanged()
  );

  /**
   * Formats a YYYY-MM string into a readable month label (e.g., "Jun 2024").
   *
   * @param yearMonth - YYYY-MM formatted string
   * @returns Formatted month string
   */
  private formatMonth(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}
