import { Directive, input, effect, ElementRef, inject, signal } from '@angular/core';
import { PokemonSelectors } from '../state/pokemon.selectors';
import { toSignal } from '@angular/core/rxjs-interop';

/**
 * Attribute directive that highlights a Pokémon row based on type effectiveness.
 * When a type is selected, rows are highlighted:
 *   - Green border = selected type is super effective against this Pokémon
 *   - Red border = selected type is weak/not very effective against this Pokémon
 *   - No highlight = neutral effectiveness
 *
 * Uses signal-based internal state for integration with OnPush change detection.
 *
 * @example <tr [appTypeHighlight]="'fire'" [pokemonTypes]="['grass', 'bug']">
 */
@Directive({
  selector: '[appTypeHighlight]',
  standalone: true,
})
export class TypeHighlightDirective {
  /** The attacking type to evaluate effectiveness for */
  readonly appTypeHighlight = input<string>('');

  /** The defending Pokémon's types */
  readonly pokemonTypes = input<string[]>([]);

  /** Element ref for applying styles */
  private readonly el = inject(ElementRef);

  /** Pokémon selectors for type effectiveness data */
  private readonly selectors = inject(PokemonSelectors);

  /** Signal holding the type effectiveness map for all types */
  private readonly typesData = toSignal(this.selectors.types$);

  /**
   * Effect that recalculates and applies border highlighting
   * whenever the attacking type or defending Pokémon types change.
   */
  constructor() {
    effect(() => {
      const attackType = this.appTypeHighlight();
      const defenseTypes = this.pokemonTypes();
      const allTypes = this.typesData();

      if (!attackType || !defenseTypes.length || !allTypes?.length) {
        this.clearHighlight();
        return;
      }

      const typeData = allTypes.find(t => t.name === attackType);
      if (!typeData) {
        this.clearHighlight();
        return;
      }

      // Calculate combined effectiveness multiplier
      let multiplier = 1;
      for (const defType of defenseTypes) {
        const efficacy = typeData.pokemon_v2_typeefficacies.find(
          e => e.pokemonV2TypeByTargetTypeId.name === defType
        );
        if (efficacy) {
          multiplier *= efficacy.damage_factor / 100;
        }
      }

      this.applyHighlight(multiplier);
    });
  }

  /**
   * Applies a colored border based on the effectiveness multiplier.
   *
   * @param multiplier - Combined damage multiplier (2 = super effective, 0.5 = resisted, 0 = immune)
   */
  private applyHighlight(multiplier: number): void {
    const el = this.el.nativeElement as HTMLElement;
    if (multiplier > 1) {
      el.style.boxShadow = '0 0 0 2px #22c55e, 0 0 12px rgba(34,197,94,0.3)';
      el.style.background = 'rgba(34, 197, 94, 0.08)';
    } else if (multiplier < 1 && multiplier > 0) {
      el.style.boxShadow = '0 0 0 2px #ef4444, 0 0 12px rgba(239,68,68,0.3)';
      el.style.background = 'rgba(239, 68, 68, 0.08)';
    } else if (multiplier === 0) {
      el.style.boxShadow = '0 0 0 2px #6b7280, 0 0 12px rgba(107,114,128,0.3)';
      el.style.background = 'rgba(107, 114, 128, 0.08)';
    } else {
      this.clearHighlight();
    }
  }

  /**
   * Removes all highlight styles from the element.
   */
  private clearHighlight(): void {
    const el = this.el.nativeElement as HTMLElement;
    el.style.boxShadow = '';
    el.style.background = '';
  }
}
