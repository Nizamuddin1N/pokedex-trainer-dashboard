import { Component, input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { StatBlock } from '../../models/pokemon.model';

/**
 * Radar chart displaying a Pokémon's 6 base stats.
 * Animates when the underlying stats data changes (new Pokémon selected).
 */
@Component({
  selector: 'app-stat-radar-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  template: `
    <div class="radar-chart-container" id="stat-radar-chart">
      <canvas baseChart
        [type]="'radar'"
        [data]="chartData"
        [options]="chartOptions"
      ></canvas>
    </div>
  `,
  styles: [`
    .radar-chart-container { width: 100%; max-width: 300px; margin: 0 auto; }
  `],
})
export class StatRadarChartComponent implements OnChanges {
  /** The Pokémon's stat block */
  readonly stats = input.required<StatBlock>();

  /** Chart.js data configuration */
  chartData: ChartConfiguration<'radar'>['data'] = {
    labels: ['HP', 'Attack', 'Defense', 'Sp. Atk', 'Sp. Def', 'Speed'],
    datasets: [{
      label: 'Base Stats',
      data: [0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
      borderColor: 'rgba(99, 102, 241, 0.8)',
      borderWidth: 2,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      pointRadius: 4,
    }],
  };

  /** Chart.js options with animation configuration */
  chartOptions: ChartConfiguration<'radar'>['options'] = {
    responsive: true,
    animation: { duration: 600, easing: 'easeOutQuart' },
    scales: {
      r: {
        beginAtZero: true,
        max: 255,
        ticks: { stepSize: 50, color: '#888', backdropColor: 'transparent', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.08)' },
        pointLabels: { color: '#ccc', font: { size: 11 } },
        angleLines: { color: 'rgba(255,255,255,0.08)' },
      },
    },
    plugins: { legend: { display: false } },
  };

  /**
   * Updates chart data when input stats change, triggering animation.
   */
  ngOnChanges(): void {
    const s = this.stats();
    this.chartData = {
      ...this.chartData,
      datasets: [{
        ...this.chartData.datasets[0],
        data: [s.hp, s.attack, s.defense, s['special-attack'], s['special-defense'], s.speed],
      }],
    };
  }
}
