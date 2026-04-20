/**
 * Represents a single Pokémon type (e.g., Fire, Water).
 */
export interface PokemonType {
  pokemon_v2_type: {
    name: string;
  };
}

/**
 * Represents a single base stat for a Pokémon.
 */
export interface PokemonStat {
  base_stat: number;
  pokemon_v2_stat: {
    name: string;
  };
}

/**
 * Represents sprite data from the PokéAPI.
 */
export interface PokemonSprite {
  sprites: string;
}

/**
 * Represents a Pokémon ability with effect text.
 */
export interface PokemonAbility {
  pokemon_v2_ability: {
    name: string;
    pokemon_v2_abilityeffecttexts: {
      effect: string;
      short_effect: string;
    }[];
  };
  is_hidden: boolean;
}

/**
 * Raw Pokémon data as returned from the PokéAPI GraphQL endpoint.
 */
export interface PokemonRaw {
  id: number;
  name: string;
  height: number;
  weight: number;
  pokemon_v2_pokemontypes: PokemonType[];
  pokemon_v2_pokemonstats: PokemonStat[];
  pokemon_v2_pokemonsprites: PokemonSprite[];
}

/**
 * Normalized Pokémon model used throughout the application.
 */
export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: StatBlock;
  spriteUrl: string;
  spriteUrlShiny: string;
}

/**
 * Stat block mapping stat names to base stat values.
 */
export interface StatBlock {
  hp: number;
  attack: number;
  defense: number;
  'special-attack': number;
  'special-defense': number;
  speed: number;
  [key: string]: number;
}

/**
 * Type efficacy data for type matchup calculations.
 */
export interface TypeEfficacy {
  damage_factor: number;
  pokemonV2TypeByTargetTypeId: {
    name: string;
  };
}

/**
 * Full type data including damage relations.
 */
export interface PokemonTypeData {
  id: number;
  name: string;
  pokemon_v2_typeefficacies: TypeEfficacy[];
}

/**
 * State shape for the Pokémon store.
 */
export interface PokemonState {
  pokemon: Pokemon[];
  selectedPokemonId: number | null;
  types: PokemonTypeData[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  searchTerm: string;
  typeFilter: string;
  statRangeMin: number;
  statRangeMax: number;
  currentPage: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
}

/**
 * Parses raw PokéAPI data into our normalized Pokemon model.
 *
 * @param raw - Raw Pokémon data from GraphQL
 * @returns Normalized Pokemon object
 */
export function parsePokemon(raw: PokemonRaw): Pokemon {
  const stats: StatBlock = {
    hp: 0,
    attack: 0,
    defense: 0,
    'special-attack': 0,
    'special-defense': 0,
    speed: 0,
  };

  for (const s of raw.pokemon_v2_pokemonstats) {
    stats[s.pokemon_v2_stat.name] = s.base_stat;
  }

  let spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${raw.id}.png`;
  let spriteUrlShiny = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${raw.id}.png`;

  if (raw.pokemon_v2_pokemonsprites?.length) {
    try {
      const parsed = JSON.parse(raw.pokemon_v2_pokemonsprites[0].sprites);
      if (parsed?.front_default) spriteUrl = parsed.front_default;
      if (parsed?.front_shiny) spriteUrlShiny = parsed.front_shiny;
    } catch {
      // fallback to default URL
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    height: raw.height,
    weight: raw.weight,
    types: raw.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name),
    stats,
    spriteUrl,
    spriteUrlShiny,
  };
}
