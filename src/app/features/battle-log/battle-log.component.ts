import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit, OnDestroy } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { TrainerStore } from '../../state/trainer.store';
import { TrainerSelectors } from '../../state/trainer.selectors';
import { LocalApiService } from '../../graphql/local-api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { BattleLogEntry } from '../../models/trainer.model';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-battle-log',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, TitleCasePipe, BaseChartDirective],
  templateUrl: './battle-log.component.html',
  styleUrl: './battle-log.component.css',
})
export default class BattleLogComponent implements OnInit, OnDestroy {
  private readonly store = inject(TrainerStore);
  private readonly selectors = inject(TrainerSelectors);
  private readonly localApi = inject(LocalApiService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly battles = toSignal(this.selectors.currentTrainerBattles$, { initialValue: [] });
  readonly battleStats = toSignal(this.selectors.battleStats$, { initialValue: { wins: 0, losses: 0, total: 0 } });
  readonly winRate = toSignal(this.selectors.winRate$, { initialValue: 0 });
  readonly monthlyBattles = toSignal(this.selectors.monthlyBattles$, { initialValue: [] });
  readonly battleLog = toSignal(this.selectors.battleLog$, { initialValue: [] });
  readonly teams = toSignal(this.selectors.currentTrainerTeams$, { initialValue: [] });
  readonly liveFeed = signal<BattleLogEntry[]>([]);
  readonly showBattleForm = signal(false);
  readonly saving = signal(false);

  /** Chart data for monthly wins/losses bar chart */
  readonly chartData = signal<ChartConfiguration<'bar'>['data']>({ labels: [], datasets: [] });
  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    animation: { duration: 500 },
    scales: {
      x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { beginAtZero: true, ticks: { color: '#888', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
    plugins: { legend: { labels: { color: '#ccc' } } },
  };

  readonly battleForm: FormGroup = this.fb.group({
    opponent_name: ['', Validators.required],
    team_id: [null, Validators.required],
    result: ['win', Validators.required],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    score_trainer: [3, [Validators.required, Validators.min(0)]],
    score_opponent: [0, [Validators.required, Validators.min(0)]],
  });

  private pollSub?: Subscription;

  ngOnInit(): void {
    this.store.loadBattles();
    this.store.loadBattleLog();
    this.store.loadTeams();
    this.startLiveFeed();
    this.updateChart();
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  /**
   * Starts the simulated live battle log feed via polling.
   * Uses RxJS interval(5000) + switchMap inside the service.
   */
  private startLiveFeed(): void {
    this.pollSub = this.localApi.pollBattleLog().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(newEntries => {
      if (newEntries.length) {
        this.store.addBattleLogEntries(newEntries);
        this.liveFeed.update(feed => [...newEntries, ...feed].slice(0, 50));
      }
    });
  }

  /** Updates the bar chart data from monthly battles */
  private updateChart(): void {
    this.selectors.monthlyBattles$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(data => {
      this.chartData.set({
        labels: data.map(d => d.month),
        datasets: [
          { label: 'Wins', data: data.map(d => d.wins), backgroundColor: 'rgba(34, 197, 94, 0.7)', borderRadius: 4 },
          { label: 'Losses', data: data.map(d => d.losses), backgroundColor: 'rgba(239, 68, 68, 0.7)', borderRadius: 4 },
        ],
      });
    });
  }

  /** Submits a new battle result */
  submitBattle(): void {
    if (this.battleForm.invalid) return;
    this.saving.set(true);
    const input = { ...this.battleForm.value, trainer_id: this.store.state.currentTrainerId };
    this.store.createBattle(input).subscribe({
      next: () => {
        this.toastService.success('Battle logged!');
        this.showBattleForm.set(false);
        this.saving.set(false);
        this.battleForm.reset({ result: 'win', date: new Date().toISOString().split('T')[0], score_trainer: 3, score_opponent: 0 });
      },
      error: () => { this.toastService.error('Failed to log battle.'); this.saving.set(false); },
    });
  }

  /** Returns CSS class for battle log severity */
  getSeverityClass(severity: string): string {
    return `severity-${severity}`;
  }
}
