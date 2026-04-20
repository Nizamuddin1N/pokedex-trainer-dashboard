/**
 * Represents a Pokémon trainer profile.
 */
export interface Trainer {
  id: number;
  name: string;
  badge_count: number;
  region: string;
  avatar_url: string;
  rank: string;
}

/**
 * Represents a Pokémon team belonging to a trainer.
 */
export interface Team {
  id: number;
  trainer_id: number;
  name: string;
  pokemon_ids: number[];
  created_at: string;
}

/**
 * Represents a battle record.
 */
export interface Battle {
  id: number;
  trainer_id: number;
  opponent_name: string;
  team_id: number;
  result: 'win' | 'loss' | 'draw';
  date: string;
  score_trainer: number;
  score_opponent: number;
}

/**
 * Represents a single entry in the battle log feed.
 */
export interface BattleLogEntry {
  id: number;
  battle_id: number;
  timestamp: string;
  message: string;
  severity: 'success' | 'info' | 'danger' | 'warning';
}

/**
 * State shape for the trainer store.
 */
export interface TrainerState {
  trainers: Trainer[];
  currentTrainerId: number;
  teams: Team[];
  battles: Battle[];
  battleLog: BattleLogEntry[];
  loading: boolean;
  error: string | null;
}

/**
 * Input for creating a new team.
 */
export interface CreateTeamInput {
  trainer_id: number;
  name: string;
  pokemon_ids: number[];
}

/**
 * Input for logging a new battle.
 */
export interface CreateBattleInput {
  trainer_id: number;
  opponent_name: string;
  team_id: number;
  result: 'win' | 'loss' | 'draw';
  date: string;
  score_trainer: number;
  score_opponent: number;
}
