import { Injectable, inject } from '@angular/core';
import { Observable, map, distinctUntilChanged, combineLatest, shareReplay } from 'rxjs';
import { PokemonStore } from './pokemon.store';
import { Pokemon, PokemonTypeData } from '../models/pokemon.model';

/**
 * Derived observable selectors for the Pokémon store.
 * Provides filtered, sorted, and paginated views of the Pokémon data.
 * Uses shareReplay(1) for expensive calculations to avoid redundant work.
 */
@Injectable({ providedIn: 'root' })
export class PokemonSelectors {
  /** Reference to the Pokémon store */
  private readonly store = inject(PokemonStore);

  /**
   * Observable of the raw Pokémon list from the store.
   *
   * @returns Observable<Pokemon[]> - All cached Pokémon
   */
  readonly allPokemon$: Observable<Pokemon[]> = this.store.state$.pipe(
    map(s => s.pokemon),
    distinctUntilChanged()
  );

  /**
   * Observable of the loading state.
   *
   * @returns Observable<boolean> - Whether data is being fetched
   */
  readonly loading$: Observable<boolean> = this.store.state$.pipe(
    map(s => s.loading),
    distinctUntilChanged()
  );

  /**
   * Observable of any error message.
   *
   * @returns Observable<string | null> - Current error or null
   */
  readonly error$: Observable<string | null> = this.store.state$.pipe(
    map(s => s.error),
    distinctUntilChanged()
  );

  /**
   * Observable of the currently selected Pokémon object.
   * Null when no Pokémon is selected.
   *
   * @returns Observable<Pokemon | null> - The selected Pokémon
   */
  readonly selectedPokemon$: Observable<Pokemon | null> = this.store.state$.pipe(
    map(s => s.pokemon.find(p => p.id === s.selectedPokemonId) || null),
    distinctUntilChanged()
  );

  /**
   * Observable of all loaded type data.
   *
   * @returns Observable<PokemonTypeData[]> - Type data with efficacies
   */
  readonly types$: Observable<PokemonTypeData[]> = this.store.state$.pipe(
    map(s => s.types),
    distinctUntilChanged()
  );

  /**
   * Computes the total base stat for a given Pokémon.
   *
   * @param pokemon - The Pokémon to calculate total stats for
   * @returns The sum of all six base stats
   */
  private totalStats(pokemon: Pokemon): number {
    return pokemon.stats.hp + pokemon.stats.attack + pokemon.stats.defense +
      pokemon.stats['special-attack'] + pokemon.stats['special-defense'] + pokemon.stats.speed;
  }

  /**
   * Observable of Pokémon filtered by search term, type, and stat range.
   * This is the main derived selector used by the Pokédex table.
   * Uses shareReplay(1) to cache the filtered result for multiple subscribers.
   *
   * @returns Observable<Pokemon[]> - Filtered Pokémon list
   */
  readonly filteredPokemon$: Observable<Pokemon[]> = this.store.state$.pipe(
    map(s => {
      let result = [...s.pokemon];

      // Filter by search term (name)
      if (s.searchTerm) {
        const term = s.searchTerm.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(term));
      }

      // Filter by type
      if (s.typeFilter) {
        result = result.filter(p => p.types.includes(s.typeFilter));
      }

      // Filter by total stat range
      result = result.filter(p => {
        const total = this.totalStats(p);
        return total >= s.statRangeMin && total <= s.statRangeMax;
      });

      // Sort
      result.sort((a, b) => {
        let valA: number | string;
        let valB: number | string;
        const col = s.sortColumn;

        if (col === 'name') {
          valA = a.name;
          valB = b.name;
        } else if (col === 'total') {
          valA = this.totalStats(a);
          valB = this.totalStats(b);
        } else if (col in a.stats) {
          valA = a.stats[col];
          valB = b.stats[col];
        } else {
          valA = (a as any)[col] ?? 0;
          valB = (b as any)[col] ?? 0;
        }

        if (valA < valB) return s.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return s.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return result;
    }),
    shareReplay(1)
  );

  /**
   * Observable of the current page of filtered/sorted Pokémon.
   * Applies pagination to the filtered results.
   *
   * @returns Observable<Pokemon[]> - Current page of Pokémon
   */
  readonly paginatedPokemon$: Observable<Pokemon[]> = combineLatest([
    this.filteredPokemon$,
    this.store.state$.pipe(map(s => ({ page: s.currentPage, size: s.pageSize })), distinctUntilChanged())
  ]).pipe(
    map(([pokemon, { page, size }]) => {
      const start = page * size;
      return pokemon.slice(start, start + size);
    }),
    shareReplay(1)
  );

  /**
   * Observable of the total number of filtered Pokémon (for pagination controls).
   *
   * @returns Observable<number> - Count of filtered results
   */
  readonly filteredCount$: Observable<number> = this.filteredPokemon$.pipe(
    map(p => p.length),
    distinctUntilChanged()
  );

  /**
   * Observable of unique type names from loaded Pokémon.
   * Used to populate the type filter dropdown.
   *
   * @returns Observable<string[]> - Sorted list of type names
   */
  readonly availableTypes$: Observable<string[]> = this.allPokemon$.pipe(
    map(pokemon => {
      const types = new Set<string>();
      pokemon.forEach(p => p.types.forEach(t => types.add(t)));
      return Array.from(types).sort();
    }),
    shareReplay(1)
  );

  /**
   * Computes type effectiveness data for a given attacking type.
   * Returns a map of target type name → damage factor (200 = super effective, 50 = not very, 0 = immune).
   * Expensive calculation, so shareReplay is used by the caller.
   *
   * @param attackingType - The attacking type name
   * @returns Observable<Map<string, number>> - Type effectiveness map
   */
  typeEffectiveness$(attackingType: string): Observable<Map<string, number>> {
    return this.types$.pipe(
      map(types => {
        const effectivenessMap = new Map<string, number>();
        const type = types.find(t => t.name === attackingType);
        if (type) {
          type.pokemon_v2_typeefficacies.forEach(e => {
            effectivenessMap.set(e.pokemonV2TypeByTargetTypeId.name, e.damage_factor);
          });
        }
        return effectivenessMap;
      }),
      shareReplay(1)
    );
  }
}
