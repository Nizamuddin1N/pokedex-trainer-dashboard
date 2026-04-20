import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms a Pokémon ID into its official sprite URL.
 * Falls back to a placeholder if the ID is invalid.
 *
 * @example {{ pokemon.id | pokemonSprite }}
 */
@Pipe({
  name: 'pokemonSprite',
  standalone: true,
})
export class PokemonSpritePipe implements PipeTransform {
  /**
   * Converts a Pokémon ID to the official PokeAPI sprite URL.
   *
   * @param id - The Pokémon national dex number
   * @param variant - Optional variant: 'default', 'shiny', 'artwork' (default: 'default')
   * @returns The sprite image URL string
   */
  transform(id: number | null | undefined, variant: string = 'default'): string {
    if (!id || id <= 0) {
      return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23222" width="96" height="96" rx="8"/><text x="48" y="52" text-anchor="middle" fill="%23666" font-size="12">?</text></svg>';
    }

    switch (variant) {
      case 'shiny':
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`;
      case 'artwork':
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
      default:
        return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }
  }
}
