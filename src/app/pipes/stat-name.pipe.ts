import { Pipe, PipeTransform } from '@angular/core';

/**
 * Map of internal stat API names to human-readable display names.
 */
const STAT_DISPLAY_NAMES: Record<string, string> = {
  'hp': 'HP',
  'attack': 'Attack',
  'defense': 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  'speed': 'Speed',
};

/**
 * Transforms a Pokémon stat key into its display-friendly name.
 *
 * @example {{ 'special-attack' | statName }} → "Sp. Atk"
 */
@Pipe({
  name: 'statName',
  standalone: true,
})
export class StatNamePipe implements PipeTransform {
  /**
   * Converts a stat key to a human-readable label.
   *
   * @param value - The stat key (e.g., 'special-attack')
   * @returns The display name (e.g., 'Sp. Atk')
   */
  transform(value: string): string {
    return STAT_DISPLAY_NAMES[value] || value;
  }
}
