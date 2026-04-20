import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, finalize } from 'rxjs';
import { Pokemon, PokemonState, PokemonTypeData } from '../models/pokemon.model';
import { PokemonApiService } from '../graphql/pokemon-api.service';

/**
 * BehaviorSubject-based reactive store for all Pokémon data.
 * Manages cached Pokémon list, types, loading states, filters,
 * pagination, and sorting. No external state library (NgRx/Akita) is used.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
  /** The PokéAPI GraphQL service */
  private readonly api = inject(PokemonApiService);

  /** Initial state for the Pokémon store */
  private readonly initialState: PokemonState = {
    pokemon: [],
    selectedPokemonId: null,
    types: [],
    loading: false,
    error: null,
    totalCount: 0,
    searchTerm: '',
    typeFilter: '',
    statRangeMin: 0,
    statRangeMax: 800,
    currentPage: 0,
    pageSize: 25,
    sortColumn: 'id',
    sortDirection: 'asc',
  };

  /** Core state holder — a BehaviorSubject emitting the full state */
  private readonly _state$ = new BehaviorSubject<PokemonState>(this.initialState);

  /** Public observable of the full Pokémon state */
  readonly state$: Observable<PokemonState> = this._state$.asObservable();

  /**
   * Returns the current snapshot of the state (synchronous).
   *
   * @returns The current PokemonState value
   */
  get state(): PokemonState {
    return this._state$.getValue();
  }

  /**
   * Updates the store with a partial state patch.
   * Merges the patch with the current state immutably.
   *
   * @param patch - Partial state to merge
   */
  private setState(patch: Partial<PokemonState>): void {
    this._state$.next({ ...this.state, ...patch });
  }

  /**
   * Loads a page of Pokémon from the PokéAPI and caches them in the store.
   * If the requested page is already cached, skips the API call.
   * Uses retry(3) via the API service for resilience.
   *
   * @param limit - Number of Pokémon per page
   * @param offset - Starting index
   */
  loadPokemon(limit: number, offset: number): void {
    this.setState({ loading: true, error: null });

    this.api.fetchPokemonList(limit, offset).pipe(
      tap(pokemon => {
        const existing = this.state.pokemon;
        const existingIds = new Set(existing.map(p => p.id));
        const newPokemon = pokemon.filter(p => !existingIds.has(p.id));
        this.setState({
          pokemon: [...existing, ...newPokemon],
          loading: false,
        });
      }),
      catchError(err => {
        this.setState({ loading: false, error: err.message || 'Failed to load Pokémon' });
        return of([]);
      }),
      finalize(() => this.setState({ loading: false }))
    ).subscribe();
  }

  /**
   * Loads the total Pokémon count for pagination.
   * Calls the aggregate count query on PokéAPI.
   */
  loadTotalCount(): void {
    this.api.fetchPokemonCount().pipe(
      tap(count => this.setState({ totalCount: count })),
      catchError(() => of(0))
    ).subscribe();
  }

  /**
   * Loads all Pokémon type data including damage relations.
   * Cached in the store for type effectiveness calculations.
   */
  loadTypes(): void {
    this.api.fetchTypes().pipe(
      tap(types => this.setState({ types })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Sets the currently selected Pokémon by ID.
   * Used to show the detail side panel.
   *
   * @param id - Pokémon ID to select, or null to deselect
   */
  selectPokemon(id: number | null): void {
    this.setState({ selectedPokemonId: id });
  }

  /**
   * Updates the search term filter.
   *
   * @param term - Search string to filter Pokémon by name
   */
  setSearchTerm(term: string): void {
    this.setState({ searchTerm: term, currentPage: 0 });
  }

  /**
   * Updates the type filter.
   *
   * @param type - Type name to filter by, or empty string for all
   */
  setTypeFilter(type: string): void {
    this.setState({ typeFilter: type, currentPage: 0 });
  }

  /**
   * Updates the base stat total range filter.
   *
   * @param min - Minimum total base stats
   * @param max - Maximum total base stats
   */
  setStatRange(min: number, max: number): void {
    this.setState({ statRangeMin: min, statRangeMax: max, currentPage: 0 });
  }

  /**
   * Updates pagination settings.
   *
   * @param page - Current page index (0-based)
   * @param pageSize - Number of items per page
   */
  setPage(page: number, pageSize?: number): void {
    const patch: Partial<PokemonState> = { currentPage: page };
    if (pageSize !== undefined) patch.pageSize = pageSize;
    this.setState(patch);
  }

  /**
   * Updates the sort column and direction.
   * Toggles direction if the same column is clicked again.
   *
   * @param column - Column key to sort by
   */
  setSortColumn(column: string): void {
    const dir = this.state.sortColumn === column && this.state.sortDirection === 'asc' ? 'desc' : 'asc';
    this.setState({ sortColumn: column, sortDirection: dir });
  }

  /**
   * Adds multiple Pokémon to the cache (used after search results return).
   *
   * @param pokemon - Array of Pokémon to merge into the cache
   */
  addToCache(pokemon: Pokemon[]): void {
    const existing = this.state.pokemon;
    const existingIds = new Set(existing.map(p => p.id));
    const newPokemon = pokemon.filter(p => !existingIds.has(p.id));
    if (newPokemon.length) {
      this.setState({ pokemon: [...existing, ...newPokemon] });
    }
  }
}
