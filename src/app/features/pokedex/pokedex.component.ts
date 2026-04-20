import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { PokemonStore } from '../../state/pokemon.store';
import { PokemonSelectors } from '../../state/pokemon.selectors';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { PokeballSpinnerComponent } from '../../shared/pokeball-spinner/pokeball-spinner.component';
import { TypeHighlightDirective } from '../../directives/type-highlight.directive';
import { PokemonDetailPanelComponent } from './pokemon-detail-panel.component';
import { Pokemon } from '../../models/pokemon.model';
import { PokemonSpritePipe } from '../../pipes/pokemon-sprite.pipe';
import { StatNamePipe } from '../../pipes/stat-name.pipe';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TitleCasePipe, TypeBadgeComponent, PokeballSpinnerComponent, TypeHighlightDirective, PokemonDetailPanelComponent, PokemonSpritePipe, StatNamePipe],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.css',
})
export default class PokedexComponent {
  readonly store = inject(PokemonStore);
  private readonly selectors = inject(PokemonSelectors);
  private readonly destroyRef = inject(DestroyRef);
  readonly statColumns = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

  readonly pokemon = toSignal(this.selectors.paginatedPokemon$, { initialValue: [] });
  readonly loading = toSignal(this.selectors.loading$, { initialValue: true });
  readonly filteredCount = toSignal(this.selectors.filteredCount$, { initialValue: 0 });
  readonly availableTypes = toSignal(this.selectors.availableTypes$, { initialValue: [] });

  readonly searchTerm = signal('');
  readonly typeFilter = signal('');
  readonly statMin = signal(0);
  readonly statMax = signal(800);
  readonly pageSize = signal(25);
  readonly currentPage = signal(0);
  readonly selectedRows = signal<number[]>([]);
  readonly selectedPokemonId = signal<number | null>(null);
  readonly selectedType = signal<string>('');

  private readonly sortColumn = toSignal(this.store.state$.pipe(map(s => s.sortColumn)), { initialValue: 'id' });
  private readonly sortDirection = toSignal(this.store.state$.pipe(map(s => s.sortDirection)), { initialValue: 'asc' as const });
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredCount() / this.pageSize())));

  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.store.loadPokemon(151, 0);
    this.store.loadTotalCount();
    this.store.loadTypes();

    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(term => this.store.setSearchTerm(term));

    effect(() => { this.store.selectPokemon(this.selectedPokemonId()); });
    effect(() => { const id = this.selectedPokemonId(); if (id) console.log(`[Analytics] Viewing Pokémon #${id}`); });
  }

  onSearch(term: string): void { this.searchTerm.set(term); this.searchSubject.next(term); }
  onTypeFilter(type: string): void { this.typeFilter.set(type); this.store.setTypeFilter(type); }
  onStatMin(value: number): void { this.statMin.set(+value); this.store.setStatRange(+value, this.statMax()); }
  onStatMax(value: number): void { this.statMax.set(+value); this.store.setStatRange(this.statMin(), +value); }
  onPageSize(size: number): void { this.pageSize.set(+size); this.currentPage.set(0); this.store.setPage(0, +size); }
  onPageChange(page: number): void {
    this.currentPage.set(page); this.store.setPage(page);
    const needed = page * this.pageSize();
    if (needed + this.pageSize() > this.store.state.pokemon.length) this.store.loadPokemon(this.pageSize(), this.store.state.pokemon.length);
  }
  onSort(column: string): void { this.store.setSortColumn(column); }
  getSortIndicator(column: string): string { if (this.sortColumn() !== column) return ''; return this.sortDirection() === 'asc' ? '▲' : '▼'; }
  onRowClick(pokemon: Pokemon): void { this.selectedPokemonId.set(this.selectedPokemonId() === pokemon.id ? null : pokemon.id); }
  toggleRow(id: number): void { this.selectedRows.update(r => r.includes(id) ? r.filter(x => x !== id) : [...r, id]); }
  isSelected(id: number): boolean { return this.selectedRows().includes(id); }
  toggleAllRows(event: Event): void { (event.target as HTMLInputElement).checked ? this.selectedRows.set(this.pokemon().map(p => p.id)) : this.selectedRows.set([]); }
  getTotalStats(p: Pokemon): number { return p.stats.hp + p.stats.attack + p.stats.defense + p.stats['special-attack'] + p.stats['special-defense'] + p.stats.speed; }
  getStatColor(value: number): string { if (value >= 150) return '#22c55e'; if (value >= 100) return '#84cc16'; if (value >= 70) return '#eab308'; if (value >= 50) return '#f97316'; return '#ef4444'; }
}
