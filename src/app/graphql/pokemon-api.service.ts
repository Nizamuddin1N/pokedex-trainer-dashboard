import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map, retry, delay } from 'rxjs';
import {
  GET_POKEMON_LIST,
  GET_POKEMON_COUNT,
  GET_POKEMON_DETAIL,
  GET_TYPES,
  SEARCH_POKEMON,
} from './graphql-queries';
import { PokemonRaw, PokemonTypeData, parsePokemon, Pokemon } from '../models/pokemon.model';

/**
 * Service for communicating with the PokéAPI public GraphQL endpoint.
 * All queries use the default Apollo client and include retry logic
 * for resilience against transient network failures.
 */
@Injectable({ providedIn: 'root' })
export class PokemonApiService {
  /** Apollo client instance for the default (PokéAPI) endpoint */
  private readonly apollo = inject(Apollo);

  /**
   * Fetches a paginated list of Pokémon from the PokéAPI.
   * Results are parsed from the raw GraphQL shape into normalized Pokemon objects.
   *
   * @param limit - Number of Pokémon to fetch per page
   * @param offset - Starting index for pagination
   * @returns Observable<Pokemon[]> - Stream of normalized Pokémon data
   */
  fetchPokemonList(limit: number, offset: number): Observable<Pokemon[]> {
    return this.apollo
      .query<{ pokemon_v2_pokemon: PokemonRaw[] }>({
        query: GET_POKEMON_LIST,
        variables: { limit, offset },
      })
      .pipe(
        retry({ count: 3, delay: 1000 }),
        map(result => result.data!.pokemon_v2_pokemon.map(parsePokemon))
      );
  }

  /**
   * Fetches the total count of Pokémon available in the PokéAPI.
   * Used for computing pagination page counts.
   *
   * @returns Observable<number> - Total Pokémon count
   */
  fetchPokemonCount(): Observable<number> {
    return this.apollo
      .query<{ pokemon_v2_pokemon_aggregate: { aggregate: { count: number } } }>({
        query: GET_POKEMON_COUNT,
      })
      .pipe(
        retry({ count: 3, delay: 1000 }),
        map(result => result.data!.pokemon_v2_pokemon_aggregate.aggregate.count)
      );
  }

  /**
   * Fetches detailed data for a single Pokémon by its ID.
   * Includes stats, types, abilities, and moves.
   *
   * @param id - The Pokémon's national dex number
   * @returns Observable<any> - Full Pokémon detail data
   */
  fetchPokemonDetail(id: number): Observable<any> {
    return this.apollo
      .query<{ pokemon_v2_pokemon: any[] }>({
        query: GET_POKEMON_DETAIL,
        variables: { id },
      })
      .pipe(
        retry({ count: 3, delay: 1000 }),
        map(result => result.data!.pokemon_v2_pokemon[0])
      );
  }

  /**
   * Fetches all Pokémon types with their damage relation data.
   * Used for type effectiveness calculations and filtering.
   *
   * @returns Observable<PokemonTypeData[]> - Stream of type data with efficacies
   */
  fetchTypes(): Observable<PokemonTypeData[]> {
    return this.apollo
      .query<{ pokemon_v2_type: PokemonTypeData[] }>({
        query: GET_TYPES,
      })
      .pipe(
        retry({ count: 3, delay: 1000 }),
        map(result => result.data!.pokemon_v2_type)
      );
  }

  /**
   * Searches Pokémon by name using a case-insensitive prefix match.
   * Used by the team builder autocomplete component.
   *
   * @param name - The search term (partial name)
   * @returns Observable<Pokemon[]> - Matching Pokémon results
   */
  searchPokemon(name: string): Observable<Pokemon[]> {
    return this.apollo
      .query<{ pokemon_v2_pokemon: PokemonRaw[] }>({
        query: SEARCH_POKEMON,
        variables: { name: `%${name}%` },
      })
      .pipe(
        retry({ count: 3, delay: 1000 }),
        map(result => result.data!.pokemon_v2_pokemon.map(parsePokemon))
      );
  }
}
