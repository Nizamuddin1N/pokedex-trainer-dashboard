import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, switchMap, Observable, of, map } from 'rxjs';
import { PokemonStore } from '../../state/pokemon.store';
import { PokemonSelectors } from '../../state/pokemon.selectors';
import { TrainerStore } from '../../state/trainer.store';
import { TrainerSelectors } from '../../state/trainer.selectors';
import { PokemonApiService } from '../../graphql/pokemon-api.service';
import { TypeBadgeComponent } from '../../shared/type-badge/type-badge.component';
import { ToastService } from '../../shared/toast/toast.service';
import { PokemonSpritePipe } from '../../pipes/pokemon-sprite.pipe';
import { Pokemon } from '../../models/pokemon.model';
import { TYPE_COLORS } from '../../shared/type-badge/type-badge.component';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-team-builder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DragDropModule, TypeBadgeComponent, PokemonSpritePipe, BaseChartDirective, DatePipe, TitleCasePipe],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.css',
})
export default class TeamBuilderComponent {
  private readonly fb = inject(FormBuilder);
  private readonly pokemonApi = inject(PokemonApiService);
  private readonly pokemonStore = inject(PokemonStore);
  private readonly trainerStore = inject(TrainerStore);
  private readonly trainerSelectors = inject(TrainerSelectors);
  private readonly pokemonSelectors = inject(PokemonSelectors);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly teams = toSignal(this.trainerSelectors.currentTrainerTeams$, { initialValue: [] });
  readonly searchResults = signal<Pokemon[]>([]);
  readonly selectedPokemon = signal<Pokemon[]>([]);
  readonly showSearch = signal(false);
  readonly competitiveMode = signal(false);
  readonly searchTerm = signal('');
  readonly saving = signal(false);

  /** Computed type distribution for the doughnut chart */
  readonly typeDistribution = computed(() => {
    const counts = new Map<string, number>();
    this.selectedPokemon().forEach(p => p.types.forEach(t => { counts.set(t, (counts.get(t) || 0) + 1); }));
    return counts;
  });

  /** Computed team total base stats */
  readonly teamTotalStats = computed(() => {
    return this.selectedPokemon().reduce((sum, p) => {
      return sum + p.stats.hp + p.stats.attack + p.stats.defense + p.stats['special-attack'] + p.stats['special-defense'] + p.stats.speed;
    }, 0);
  });

  /** Type coverage warning - checks for unresisted types */
  readonly typeWeaknessWarning = computed(() => {
    const team = this.selectedPokemon();
    if (team.length < 2) return '';
    const teamTypes = new Set<string>();
    team.forEach(p => p.types.forEach(t => teamTypes.add(t)));
    const commonTypes = ['fire', 'water', 'grass', 'electric', 'ground', 'flying', 'psychic', 'dragon'];
    const missing = commonTypes.filter(t => !teamTypes.has(t));
    if (missing.length > 4) return `Your team lacks coverage for: ${missing.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}`;
    return '';
  });

  /** Doughnut chart data derived from type distribution */
  readonly chartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const dist = this.typeDistribution();
    const labels = Array.from(dist.keys());
    const data = Array.from(dist.values());
    const colors = labels.map(l => TYPE_COLORS[l] || '#777');
    return { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0 }] };
  });

  readonly chartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'right', labels: { color: '#ccc', font: { size: 11 } } } },
    cutout: '60%',
    animation: { duration: 500 },
  };

  /** Reactive form for team creation */
  readonly teamForm: FormGroup;
  private readonly searchSubject = new Subject<string>();

  constructor() {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      tier: [''],
    });

    // Debounced Pokémon search
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => term.length >= 2 ? this.pokemonApi.searchPokemon(term) : of([])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(results => {
      this.searchResults.set(results.filter(r => !this.selectedPokemon().find(s => s.id === r.id)));
    });
  }

  /** Handles search input */
  onSearchInput(term: string): void { this.searchTerm.set(term); this.searchSubject.next(term); }

  /** Adds a Pokémon to the team (max 6) */
  addPokemon(pokemon: Pokemon): void {
    if (this.selectedPokemon().length >= 6) return;
    this.selectedPokemon.update(list => [...list, pokemon]);
    this.searchResults.update(r => r.filter(p => p.id !== pokemon.id));
    this.searchTerm.set('');
    this.showSearch.set(false);
  }

  /** Removes a Pokémon from the team */
  removePokemon(id: number): void {
    this.selectedPokemon.update(list => list.filter(p => p.id !== id));
  }

  /** Handles CDK drag-drop reordering and adding from search results */
  onDrop(event: CdkDragDrop<Pokemon[]>): void {
    if (event.previousContainer === event.container) {
      const arr = [...this.selectedPokemon()];
      const [moved] = arr.splice(event.previousIndex, 1);
      arr.splice(event.currentIndex, 0, moved);
      this.selectedPokemon.set(arr);
    } else {
      const pokemon = event.previousContainer.data[event.previousIndex];
      if (this.selectedPokemon().length < 6) this.addPokemon(pokemon);
    }
  }

  /** Submits the team form */
  saveTeam(): void {
    if (this.teamForm.invalid || this.selectedPokemon().length === 0) return;
    this.saving.set(true);
    const input = {
      trainer_id: this.trainerStore.state.currentTrainerId,
      name: this.teamForm.value.name,
      pokemon_ids: this.selectedPokemon().map(p => p.id),
    };
    this.trainerStore.createTeam(input).subscribe({
      next: () => {
        this.toastService.success(`Team "${input.name}" created!`);
        this.teamForm.reset();
        this.selectedPokemon.set([]);
        this.saving.set(false);
      },
      error: () => {
        this.toastService.error('Failed to create team. Please try again.');
        this.saving.set(false);
      },
    });
  }

  /** Deletes an existing team */
  deleteTeam(id: number): void {
    this.trainerStore.deleteTeam(id).subscribe({
      next: () => this.toastService.success('Team deleted.'),
      error: () => this.toastService.error('Failed to delete team.'),
    });
  }
}
