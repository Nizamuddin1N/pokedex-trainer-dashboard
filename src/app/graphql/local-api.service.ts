import { Injectable, inject } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, map, interval, switchMap, scan, distinctUntilChanged } from 'rxjs';
import {
  GET_TRAINERS,
  GET_TRAINER,
  GET_TEAMS,
  GET_BATTLES,
  GET_BATTLE_LOG,
  CREATE_TEAM,
  UPDATE_TEAM,
  DELETE_TEAM,
  CREATE_BATTLE,
  UPDATE_TRAINER,
} from './graphql-queries';
import { Trainer, Team, Battle, BattleLogEntry, CreateTeamInput, CreateBattleInput } from '../models/trainer.model';

/**
 * Service for communicating with the local json-graphql-server mock.
 * Uses the 'local' named Apollo client targeting localhost:4000.
 * Handles all trainer, team, battle, and battle-log CRUD operations.
 */
@Injectable({ providedIn: 'root' })
export class LocalApiService {
  /** Apollo client instance — uses the 'local' named client */
  private readonly apollo = inject(Apollo);

  /**
   * Returns the local Apollo client instance.
   * json-graphql-server runs on localhost:4000.
   *
   * @returns The named 'local' Apollo client
   */
  private get localClient() {
    return this.apollo.use('local');
  }

  /**
   * Fetches all trainers from the local server.
   *
   * @returns Observable<Trainer[]> - List of all trainer profiles
   */
  fetchTrainers(): Observable<Trainer[]> {
    return this.localClient
      .query<{ allTrainers: Trainer[] }>({ query: GET_TRAINERS, fetchPolicy: 'network-only' })
      .pipe(map(r => r.data!.allTrainers));
  }

  /**
   * Fetches a single trainer by ID.
   *
   * @param id - Trainer ID
   * @returns Observable<Trainer> - The trainer profile
   */
  fetchTrainer(id: number): Observable<Trainer> {
    return this.localClient
      .query<{ Trainer: Trainer }>({ query: GET_TRAINER, variables: { id }, fetchPolicy: 'network-only' })
      .pipe(map(r => r.data!.Trainer));
  }

  /**
   * Fetches all teams from the local server.
   *
   * @returns Observable<Team[]> - List of all teams
   */
  fetchTeams(): Observable<Team[]> {
    return this.localClient
      .query<{ allTeams: Team[] }>({ query: GET_TEAMS, fetchPolicy: 'network-only' })
      .pipe(map(r => r.data!.allTeams));
  }

  /**
   * Fetches all battle records from the local server.
   *
   * @returns Observable<Battle[]> - List of all battles
   */
  fetchBattles(): Observable<Battle[]> {
    return this.localClient
      .query<{ allBattles: Battle[] }>({ query: GET_BATTLES, fetchPolicy: 'network-only' })
      .pipe(map(r => r.data!.allBattles));
  }

  /**
   * Fetches all battle log entries from the local server.
   * Used as the basis for the simulated live feed.
   *
   * @returns Observable<BattleLogEntry[]> - List of battle log entries
   */
  fetchBattleLog(): Observable<BattleLogEntry[]> {
    return this.localClient
      .query<{ allBattlelogs: BattleLogEntry[] }>({ query: GET_BATTLE_LOG, fetchPolicy: 'network-only' })
      .pipe(map(r => r.data!.allBattlelogs));
  }

  /**
   * Simulates a live battle log feed using polling.
   *
   * WHY POLLING INSTEAD OF WEBSOCKET SUBSCRIPTIONS:
   * json-graphql-server is a simple HTTP-only mock server that does not support
   * WebSocket connections or GraphQL subscriptions. To simulate real-time behavior,
   * we use RxJS interval(5000) combined with switchMap to poll the battle_log
   * endpoint every 5 seconds. The scan operator tracks previously seen IDs
   * and emits only new entries, creating a feed-like experience.
   *
   * In a production app with a real GraphQL server (e.g., Apollo Server with
   * graphql-ws), this would be replaced with a proper subscription:
   *   subscription OnBattleLogAdded { battleLogAdded { id message severity } }
   *
   * @returns Observable<BattleLogEntry[]> - Stream emitting only new log entries
   */
  pollBattleLog(): Observable<BattleLogEntry[]> {
    return interval(5000).pipe(
      switchMap(() => this.fetchBattleLog()),
      scan<BattleLogEntry[], { seen: Set<number>; newEntries: BattleLogEntry[] }>(
        (acc, entries) => {
          const newEntries = entries.filter(e => !acc.seen.has(e.id));
          newEntries.forEach(e => acc.seen.add(e.id));
          return { seen: acc.seen, newEntries };
        },
        { seen: new Set<number>(), newEntries: [] }
      ),
      map(acc => acc.newEntries),
      distinctUntilChanged()
    );
  }

  /**
   * Creates a new team via GraphQL mutation.
   *
   * @param input - Team creation data (trainer_id, name, pokemon_ids)
   * @returns Observable<Team> - The newly created team
   */
  createTeam(input: CreateTeamInput): Observable<Team> {
    return this.localClient
      .mutate<{ createTeam: Team }>({
        mutation: CREATE_TEAM,
        variables: {
          ...input,
          created_at: new Date().toISOString(),
        },
      })
      .pipe(map(r => r.data!.createTeam));
  }

  /**
   * Updates an existing team's name and/or Pokémon lineup.
   *
   * @param id - Team ID to update
   * @param name - New team name (optional)
   * @param pokemonIds - New Pokémon IDs array (optional)
   * @returns Observable<Team> - The updated team
   */
  updateTeam(id: number, name?: string, pokemonIds?: number[]): Observable<Team> {
    return this.localClient
      .mutate<{ updateTeam: Team }>({
        mutation: UPDATE_TEAM,
        variables: { id, name, pokemon_ids: pokemonIds },
      })
      .pipe(map(r => r.data!.updateTeam));
  }

  /**
   * Deletes a team by ID.
   *
   * @param id - Team ID to delete
   * @returns Observable<{ id: number }> - The deleted team's ID
   */
  deleteTeam(id: number): Observable<{ id: number }> {
    return this.localClient
      .mutate<{ removeTeam: { id: number } }>({
        mutation: DELETE_TEAM,
        variables: { id },
      })
      .pipe(map(r => r.data!.removeTeam));
  }

  /**
   * Logs a new battle result via GraphQL mutation.
   *
   * @param input - Battle data (trainer_id, opponent, result, etc.)
   * @returns Observable<Battle> - The newly created battle record
   */
  createBattle(input: CreateBattleInput): Observable<Battle> {
    return this.localClient
      .mutate<{ createBattle: Battle }>({
        mutation: CREATE_BATTLE,
        variables: input,
      })
      .pipe(map(r => r.data!.createBattle));
  }

  /**
   * Updates a trainer's profile data.
   *
   * @param trainer - Partial trainer object with ID and fields to update
   * @returns Observable<Trainer> - The updated trainer profile
   */
  updateTrainer(trainer: Partial<Trainer> & { id: number }): Observable<Trainer> {
    return this.localClient
      .mutate<{ updateTrainer: Trainer }>({
        mutation: UPDATE_TRAINER,
        variables: trainer,
      })
      .pipe(map(r => r.data!.updateTrainer));
  }
}
