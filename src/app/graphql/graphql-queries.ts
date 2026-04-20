import { gql } from 'apollo-angular';

// ============================================================
// PokéAPI Queries (Public API - beta.pokeapi.co)
// ============================================================

/**
 * Fetches a paginated list of Pokémon with their types, stats, and sprites.
 * Used by the Pokédex table and search features.
 */
export const GET_POKEMON_LIST = gql`
  query GetPokemonList($limit: Int, $offset: Int) {
    pokemon_v2_pokemon(limit: $limit, offset: $offset, order_by: { id: asc }) {
      id
      name
      height
      weight
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemonsprites {
        sprites
      }
    }
  }
`;

/**
 * Fetches the total count of Pokémon in the database.
 * Used for pagination calculations.
 */
export const GET_POKEMON_COUNT = gql`
  query GetPokemonCount {
    pokemon_v2_pokemon_aggregate {
      aggregate {
        count
      }
    }
  }
`;

/**
 * Fetches detailed data for a single Pokémon by ID.
 * Includes stats, types, abilities, and sprites.
 */
export const GET_POKEMON_DETAIL = gql`
  query GetPokemonDetail($id: Int!) {
    pokemon_v2_pokemon(where: { id: { _eq: $id } }) {
      id
      name
      height
      weight
      base_experience
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
      pokemon_v2_pokemonsprites {
        sprites
      }
      pokemon_v2_pokemonabilities {
        pokemon_v2_ability {
          name
          pokemon_v2_abilityeffecttexts(where: { language_id: { _eq: 9 } }) {
            effect
            short_effect
          }
        }
        is_hidden
      }
      pokemon_v2_pokemonmoves(limit: 20) {
        pokemon_v2_move {
          name
          power
          accuracy
          pp
          pokemon_v2_type {
            name
          }
        }
      }
    }
  }
`;

/**
 * Fetches all Pokémon types with their damage relations.
 * Used for type effectiveness calculations and filtering.
 */
export const GET_TYPES = gql`
  query GetTypes {
    pokemon_v2_type {
      id
      name
      pokemon_v2_typeefficacies {
        damage_factor
        pokemonV2TypeByTargetTypeId {
          name
        }
      }
    }
  }
`;

/**
 * Searches Pokémon by name prefix.
 * Used for the team builder autocomplete.
 */
export const SEARCH_POKEMON = gql`
  query SearchPokemon($name: String!) {
    pokemon_v2_pokemon(where: { name: { _ilike: $name } }, limit: 20) {
      id
      name
      pokemon_v2_pokemontypes {
        pokemon_v2_type {
          name
        }
      }
      pokemon_v2_pokemonsprites {
        sprites
      }
      pokemon_v2_pokemonstats {
        base_stat
        pokemon_v2_stat {
          name
        }
      }
    }
  }
`;

// ============================================================
// Local GraphQL Queries (json-graphql-server on localhost:4000)
// ============================================================

/**
 * Fetches all trainers from the local mock server.
 */
export const GET_TRAINERS = gql`
  query GetTrainers {
    allTrainers {
      id
      name
      badge_count
      region
      avatar_url
      rank
    }
  }
`;

/**
 * Fetches a single trainer by ID.
 */
export const GET_TRAINER = gql`
  query GetTrainer($id: Int!) {
    Trainer(id: $id) {
      id
      name
      badge_count
      region
      avatar_url
      rank
    }
  }
`;

/**
 * Fetches all teams, optionally filtered by trainer.
 */
export const GET_TEAMS = gql`
  query GetTeams {
    allTeams {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

/**
 * Fetches all battles from the local mock server.
 */
export const GET_BATTLES = gql`
  query GetBattles {
    allBattles {
      id
      trainer_id
      opponent_name
      team_id
      result
      date
      score_trainer
      score_opponent
    }
  }
`;

/**
 * Fetches all battle log entries from the local mock server.
 * Used by the polling-based live feed.
 */
export const GET_BATTLE_LOG = gql`
  query GetBattleLog {
    allBattlelogs {
      id
      battle_id
      timestamp
      message
      severity
    }
  }
`;

// ============================================================
// Local GraphQL Mutations
// ============================================================

/**
 * Creates a new team on the local mock server.
 */
export const CREATE_TEAM = gql`
  mutation CreateTeam(
    $trainer_id: Int!
    $name: String!
    $pokemon_ids: [Int]!
    $created_at: String!
  ) {
    createTeam(
      trainer_id: $trainer_id
      name: $name
      pokemon_ids: $pokemon_ids
      created_at: $created_at
    ) {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

/**
 * Updates an existing team on the local mock server.
 */
export const UPDATE_TEAM = gql`
  mutation UpdateTeam(
    $id: Int!
    $name: String
    $pokemon_ids: [Int]
  ) {
    updateTeam(
      id: $id
      name: $name
      pokemon_ids: $pokemon_ids
    ) {
      id
      trainer_id
      name
      pokemon_ids
      created_at
    }
  }
`;

/**
 * Deletes a team from the local mock server.
 */
export const DELETE_TEAM = gql`
  mutation DeleteTeam($id: Int!) {
    removeTeam(id: $id) {
      id
    }
  }
`;

/**
 * Creates a new battle record on the local mock server.
 */
export const CREATE_BATTLE = gql`
  mutation CreateBattle(
    $trainer_id: Int!
    $opponent_name: String!
    $team_id: Int!
    $result: String!
    $date: String!
    $score_trainer: Int!
    $score_opponent: Int!
  ) {
    createBattle(
      trainer_id: $trainer_id
      opponent_name: $opponent_name
      team_id: $team_id
      result: $result
      date: $date
      score_trainer: $score_trainer
      score_opponent: $score_opponent
    ) {
      id
      trainer_id
      opponent_name
      team_id
      result
      date
      score_trainer
      score_opponent
    }
  }
`;

/**
 * Updates trainer profile on the local mock server.
 */
export const UPDATE_TRAINER = gql`
  mutation UpdateTrainer(
    $id: Int!
    $name: String
    $badge_count: Int
    $region: String
    $avatar_url: String
    $rank: String
  ) {
    updateTrainer(
      id: $id
      name: $name
      badge_count: $badge_count
      region: $region
      avatar_url: $avatar_url
      rank: $rank
    ) {
      id
      name
      badge_count
      region
      avatar_url
      rank
    }
  }
`;
