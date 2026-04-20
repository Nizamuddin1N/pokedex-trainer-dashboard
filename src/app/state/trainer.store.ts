import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap, finalize } from 'rxjs';
import { Trainer, Team, Battle, BattleLogEntry, TrainerState, CreateTeamInput, CreateBattleInput } from '../models/trainer.model';
import { LocalApiService } from '../graphql/local-api.service';

/**
 * BehaviorSubject-based reactive store for trainer, team, battle,
 * and battle-log data. Handles optimistic updates for mutations
 * with automatic rollback on error.
 */
@Injectable({ providedIn: 'root' })
export class TrainerStore {
  /** Local GraphQL API service */
  private readonly api = inject(LocalApiService);

  /** Initial state for the trainer store */
  private readonly initialState: TrainerState = {
    trainers: [],
    currentTrainerId: 1,
    teams: [],
    battles: [],
    battleLog: [],
    loading: false,
    error: null,
  };

  /** Core state holder */
  private readonly _state$ = new BehaviorSubject<TrainerState>(this.initialState);

  /** Public observable of the full trainer state */
  readonly state$: Observable<TrainerState> = this._state$.asObservable();

  /**
   * Returns the current state snapshot synchronously.
   *
   * @returns The current TrainerState
   */
  get state(): TrainerState {
    return this._state$.getValue();
  }

  /**
   * Merges a partial patch into the current state.
   *
   * @param patch - Partial TrainerState to merge
   */
  private setState(patch: Partial<TrainerState>): void {
    this._state$.next({ ...this.state, ...patch });
  }

  /**
   * Loads all trainers from the local server.
   */
  loadTrainers(): void {
    this.setState({ loading: true });
    this.api.fetchTrainers().pipe(
      tap(trainers => this.setState({ trainers, loading: false })),
      catchError(err => {
        this.setState({ loading: false, error: err.message });
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Loads all teams from the local server.
   */
  loadTeams(): void {
    this.api.fetchTeams().pipe(
      tap(teams => this.setState({ teams })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Loads all battles from the local server.
   */
  loadBattles(): void {
    this.api.fetchBattles().pipe(
      tap(battles => this.setState({ battles })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Loads all battle log entries from the local server.
   */
  loadBattleLog(): void {
    this.api.fetchBattleLog().pipe(
      tap(battleLog => this.setState({ battleLog })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Sets the current trainer ID.
   * Persisted to localStorage via an effect in the app component.
   *
   * @param id - Trainer ID to set as active
   */
  setCurrentTrainer(id: number): void {
    this.setState({ currentTrainerId: id });
  }

  /**
   * Creates a new team with optimistic update.
   * Immediately adds a temporary team to the UI, then replaces it
   * with the server response. Rolls back on error.
   *
   * @param input - Team creation input data
   * @returns Observable<Team> - The created team from the server
   */
  createTeam(input: CreateTeamInput): Observable<Team> {
    const optimisticTeam: Team = {
      id: Date.now(),
      trainer_id: input.trainer_id,
      name: input.name,
      pokemon_ids: input.pokemon_ids,
      created_at: new Date().toISOString(),
    };

    // Optimistic update: add immediately
    const previousTeams = [...this.state.teams];
    this.setState({ teams: [...this.state.teams, optimisticTeam] });

    return this.api.createTeam(input).pipe(
      tap(created => {
        // Replace optimistic entry with server response
        const teams = this.state.teams.map(t =>
          t.id === optimisticTeam.id ? created : t
        );
        this.setState({ teams });
      }),
      catchError(err => {
        // Rollback on error
        this.setState({ teams: previousTeams, error: 'Failed to create team' });
        throw err;
      })
    );
  }

  /**
   * Updates an existing team.
   *
   * @param id - Team ID to update
   * @param name - New name (optional)
   * @param pokemonIds - New Pokémon IDs (optional)
   * @returns Observable<Team> - The updated team
   */
  updateTeam(id: number, name?: string, pokemonIds?: number[]): Observable<Team> {
    return this.api.updateTeam(id, name, pokemonIds).pipe(
      tap(updated => {
        const teams = this.state.teams.map(t => t.id === id ? updated : t);
        this.setState({ teams });
      }),
      catchError(err => {
        this.setState({ error: 'Failed to update team' });
        throw err;
      })
    );
  }

  /**
   * Deletes a team by ID with optimistic removal.
   * Removes from UI immediately, rolls back if the server call fails.
   *
   * @param id - Team ID to delete
   * @returns Observable<{ id: number }> - Confirmation of deletion
   */
  deleteTeam(id: number): Observable<{ id: number }> {
    const previousTeams = [...this.state.teams];
    this.setState({ teams: this.state.teams.filter(t => t.id !== id) });

    return this.api.deleteTeam(id).pipe(
      catchError(err => {
        this.setState({ teams: previousTeams, error: 'Failed to delete team' });
        throw err;
      })
    );
  }

  /**
   * Logs a new battle result.
   *
   * @param input - Battle creation data
   * @returns Observable<Battle> - The created battle record
   */
  createBattle(input: CreateBattleInput): Observable<Battle> {
    return this.api.createBattle(input).pipe(
      tap(battle => {
        this.setState({ battles: [...this.state.battles, battle] });
      }),
      catchError(err => {
        this.setState({ error: 'Failed to log battle' });
        throw err;
      })
    );
  }

  /**
   * Updates a trainer's profile.
   *
   * @param trainer - Partial trainer data with ID
   * @returns Observable<Trainer> - The updated trainer
   */
  updateTrainer(trainer: Partial<Trainer> & { id: number }): Observable<Trainer> {
    return this.api.updateTrainer(trainer).pipe(
      tap(updated => {
        const trainers = this.state.trainers.map(t => t.id === updated.id ? updated : t);
        this.setState({ trainers });
      }),
      catchError(err => {
        this.setState({ error: 'Failed to update trainer' });
        throw err;
      })
    );
  }

  /**
   * Appends new battle log entries to the store.
   * Used by the polling-based live feed.
   *
   * @param entries - New battle log entries to add
   */
  addBattleLogEntries(entries: BattleLogEntry[]): void {
    if (entries.length) {
      this.setState({ battleLog: [...this.state.battleLog, ...entries] });
    }
  }
}
