import { Component, input, output, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PokemonStore } from '../../state/pokemon.store';
import { PokemonSelectors } from '../../state/pokemon.selectors';
import { PokemonApiService } from '../../graphql/pokemon-api.service';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { AudioPlayerComponent } from '../../shared/audio-player/audio-player.component';
import { VideoPlayerComponent } from './video-player.component';
import { StatRadarChartComponent } from './stat-radar-chart.component';
import { PokemonSpritePipe } from '../../pipes/pokemon-sprite.pipe';
import { StatNamePipe } from '../../pipes/stat-name.pipe';

/**
 * Slide-in detail side panel for a selected Pokémon.
 * Shows full stats radar chart, abilities, moves, video player, and cry audio.
 */
@Component({
  selector: 'app-pokemon-detail-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe, TypeBadgeComponent, AudioPlayerComponent, VideoPlayerComponent, StatRadarChartComponent, PokemonSpritePipe, StatNamePipe],
  template: `
    <div class="panel-overlay" (click)="closed.emit()" id="detail-overlay"></div>
    <div class="detail-panel" id="detail-panel">
      <button class="close-btn" (click)="closed.emit()" id="close-detail-btn">✕</button>
      @if (pokemon(); as p) {
        <div class="panel-header">
          <img [src]="p.id | pokemonSprite:'artwork'" [alt]="p.name" class="detail-artwork" />
          <h2 class="detail-name">{{ p.name | titlecase }}</h2>
          <span class="detail-id">#{{ p.id }}</span>
          <div class="detail-types">
            @for (type of p.types; track type) { <app-type-badge [typeName]="type" /> }
          </div>
        </div>
        <div class="panel-body">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Height</span><span class="info-value">{{ p.height / 10 }} m</span></div>
            <div class="info-item"><span class="info-label">Weight</span><span class="info-value">{{ p.weight / 10 }} kg</span></div>
          </div>
          <app-stat-radar-chart [stats]="p.stats" />
          <div class="stats-bars">
            @for (stat of statKeys; track stat) {
              <div class="stat-row">
                <span class="stat-label">{{ stat | statName }}</span>
                <div class="stat-bar"><div class="stat-bar-fill" [style.width.%]="(p.stats[stat] / 255) * 100" [style.background]="getStatColor(p.stats[stat])"></div></div>
                <span class="stat-num">{{ p.stats[stat] }}</span>
              </div>
            }
          </div>
          <app-audio-player [pokemonId]="p.id" />
          <app-video-player [pokemonId]="p.id" [pokemonName]="p.name" />
          @if (detail()) {
            <div class="abilities-section">
              <h3>Abilities</h3>
              @for (a of detail().pokemon_v2_pokemonabilities; track a.pokemon_v2_ability.name) {
                <div class="ability-card" [class.hidden-ability]="a.is_hidden">
                  <span class="ability-name">{{ a.pokemon_v2_ability.name | titlecase }}</span>
                  @if (a.is_hidden) { <span class="hidden-tag">Hidden</span> }
                  @if (a.pokemon_v2_ability.pokemon_v2_abilityeffecttexts.length) {
                    <p class="ability-desc">{{ a.pokemon_v2_ability.pokemon_v2_abilityeffecttexts[0].short_effect }}</p>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .panel-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; animation: fadeIn 0.2s; }
    .detail-panel { position: fixed; top: 0; right: 0; bottom: 0; width: 440px; max-width: 90vw; background: var(--bg-primary); z-index: 101; overflow-y: auto; animation: slideInRight 0.3s ease-out; box-shadow: -8px 0 40px rgba(0,0,0,0.4); padding: 24px; }
    .close-btn { position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.1); border: none; color: var(--text-primary); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; z-index: 2; transition: background 0.2s; }
    .close-btn:hover { background: rgba(255,255,255,0.2); }
    .panel-header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid var(--border-color); }
    .detail-artwork { width: 180px; height: 180px; filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3)); animation: float 3s ease-in-out infinite; }
    .detail-name { font-size: 1.5rem; font-weight: 800; margin: 8px 0 0; text-transform: capitalize; }
    .detail-id { color: var(--text-secondary); font-size: 0.9rem; }
    .detail-types { display: flex; gap: 6px; justify-content: center; margin-top: 8px; }
    .panel-body { padding-top: 20px; display: flex; flex-direction: column; gap: 20px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-item { background: var(--card-bg); padding: 12px; border-radius: 10px; text-align: center; }
    .info-label { display: block; font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    .info-value { font-size: 1.1rem; font-weight: 700; }
    .stats-bars { display: flex; flex-direction: column; gap: 8px; }
    .stat-row { display: flex; align-items: center; gap: 8px; }
    .stat-label { width: 60px; font-size: 0.75rem; color: var(--text-secondary); text-align: right; }
    .stat-bar { flex: 1; height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
    .stat-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .stat-num { width: 30px; font-size: 0.8rem; font-weight: 600; text-align: right; font-variant-numeric: tabular-nums; }
    .abilities-section h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 8px; }
    .ability-card { background: var(--card-bg); padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-color); }
    .ability-card.hidden-ability { border-color: rgba(139,92,246,0.3); }
    .ability-name { font-weight: 600; font-size: 0.85rem; }
    .hidden-tag { font-size: 0.65rem; background: rgba(139,92,246,0.2); color: #a78bfa; padding: 2px 8px; border-radius: 10px; margin-left: 8px; }
    .ability-desc { font-size: 0.78rem; color: var(--text-secondary); margin: 4px 0 0; }
    @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  `],
})
export class PokemonDetailPanelComponent implements OnInit {
  readonly pokemonId = input.required<number>();
  readonly closed = output<void>();
  private readonly selectors = inject(PokemonSelectors);
  private readonly api = inject(PokemonApiService);
  readonly pokemon = toSignal(this.selectors.selectedPokemon$);
  readonly detail = signal<any>(null);
  readonly statKeys = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

  ngOnInit(): void {
    this.api.fetchPokemonDetail(this.pokemonId()).subscribe(d => this.detail.set(d));
  }

  getStatColor(value: number): string {
    if (value >= 150) return '#22c55e'; if (value >= 100) return '#84cc16'; if (value >= 70) return '#eab308'; if (value >= 50) return '#f97316'; return '#ef4444';
  }
}
