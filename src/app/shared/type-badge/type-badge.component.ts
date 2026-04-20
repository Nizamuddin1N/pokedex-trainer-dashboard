import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Color mapping for each Pokémon type.
 * Used for badge backgrounds and type-related visual indicators.
 */
export const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AD',
};

/**
 * Displays a Pokémon type as a colored badge pill.
 * Color is automatically determined from the type name.
 *
 * @example <app-type-badge [typeName]="'fire'" />
 */
@Component({
  selector: 'app-type-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="type-badge"
      [style.background-color]="getColor()"
      [style.color]="'#fff'"
      [style.text-shadow]="'0 1px 2px rgba(0,0,0,0.3)'"
    >
      {{ typeName().toUpperCase() }}
    </span>
  `,
  styles: [`
    .type-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      white-space: nowrap;
      line-height: 1.6;
    }
  `],
})
export class TypeBadgeComponent {
  /** The Pokémon type name (e.g., 'fire', 'water') */
  readonly typeName = input.required<string>();

  /**
   * Returns the background color for the given type.
   *
   * @returns Hex color string
   */
  getColor(): string {
    return TYPE_COLORS[this.typeName()] || '#777';
  }
}
