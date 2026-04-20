import { TestBed } from '@angular/core/testing';
import { PokemonStore } from './pokemon.store';
import { PokemonApiService } from '../graphql/pokemon-api.service';
import { of } from 'rxjs';
import { Pokemon } from '../models/pokemon.model';

/**
 * Unit tests for PokemonStore.
 * Tests the BehaviorSubject-based store's core methods:
 * loading data, caching, state updates, and filter management.
 */
describe('PokemonStore', () => {
  let store: PokemonStore;
  let apiSpy: jasmine.SpyObj<PokemonApiService>;

  const mockPokemon: Pokemon[] = [
    {
      id: 1, name: 'bulbasaur', height: 7, weight: 69,
      types: ['grass', 'poison'],
      stats: { hp: 45, attack: 49, defense: 49, 'special-attack': 65, 'special-defense': 65, speed: 45 },
      spriteUrl: 'https://example.com/1.png', spriteUrlShiny: 'https://example.com/1s.png',
    },
    {
      id: 4, name: 'charmander', height: 6, weight: 85,
      types: ['fire'],
      stats: { hp: 39, attack: 52, defense: 43, 'special-attack': 60, 'special-defense': 50, speed: 65 },
      spriteUrl: 'https://example.com/4.png', spriteUrlShiny: 'https://example.com/4s.png',
    },
  ];

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('PokemonApiService', ['fetchPokemonList', 'fetchPokemonCount', 'fetchTypes']);
    apiSpy.fetchPokemonList.and.returnValue(of(mockPokemon));
    apiSpy.fetchPokemonCount.and.returnValue(of(151));
    apiSpy.fetchTypes.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        PokemonStore,
        { provide: PokemonApiService, useValue: apiSpy },
      ],
    });
    store = TestBed.inject(PokemonStore);
  });

  /**
   * Verifies that loadPokemon fetches data from the API and caches it in state.
   */
  it('should load Pokémon and update state', () => {
    store.loadPokemon(10, 0);
    expect(apiSpy.fetchPokemonList).toHaveBeenCalledWith(10, 0);
    expect(store.state.pokemon.length).toBe(2);
    expect(store.state.pokemon[0].name).toBe('bulbasaur');
    expect(store.state.loading).toBeFalse();
  });

  /**
   * Verifies that setSearchTerm updates the search filter and resets page.
   */
  it('should update search term and reset page', () => {
    store.setPage(3);
    store.setSearchTerm('char');
    expect(store.state.searchTerm).toBe('char');
    expect(store.state.currentPage).toBe(0);
  });

  /**
   * Verifies that setTypeFilter updates the type filter.
   */
  it('should update type filter', () => {
    store.setTypeFilter('fire');
    expect(store.state.typeFilter).toBe('fire');
  });

  /**
   * Verifies that setSortColumn toggles sort direction.
   */
  it('should toggle sort direction when same column clicked', () => {
    store.setSortColumn('name');
    expect(store.state.sortColumn).toBe('name');
    expect(store.state.sortDirection).toBe('asc');

    store.setSortColumn('name');
    expect(store.state.sortDirection).toBe('desc');
  });

  /**
   * Verifies that addToCache merges new Pokémon without duplicating.
   */
  it('should add to cache without duplicates', () => {
    store.loadPokemon(10, 0);
    const newPokemon: Pokemon = {
      id: 7, name: 'squirtle', height: 5, weight: 90,
      types: ['water'],
      stats: { hp: 44, attack: 48, defense: 65, 'special-attack': 50, 'special-defense': 64, speed: 43 },
      spriteUrl: '', spriteUrlShiny: '',
    };
    store.addToCache([mockPokemon[0], newPokemon]);
    expect(store.state.pokemon.length).toBe(3);
  });
});
