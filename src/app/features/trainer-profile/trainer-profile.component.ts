import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TrainerStore } from '../../state/trainer.store';
import { TrainerSelectors } from '../../state/trainer.selectors';
import { ToastService } from '../../shared/toast/toast.service';
import { PokemonSpritePipe } from '../../pipes/pokemon-sprite.pipe';

@Component({
  selector: 'app-trainer-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, PokemonSpritePipe],
  templateUrl: './trainer-profile.component.html',
  styleUrl: './trainer-profile.component.css',
})
export default class TrainerProfileComponent {
  private readonly store = inject(TrainerStore);
  private readonly selectors = inject(TrainerSelectors);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly trainer = toSignal(this.selectors.currentTrainer$);
  readonly winRate = toSignal(this.selectors.winRate$, { initialValue: 0 });
  readonly battleStats = toSignal(this.selectors.battleStats$, { initialValue: { wins: 0, losses: 0, total: 0 } });
  readonly teams = toSignal(this.selectors.currentTrainerTeams$, { initialValue: [] });
  readonly trainers = toSignal(this.selectors.trainers$, { initialValue: [] });

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly editForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    region: [''],
    rank: [''],
    badge_count: [0, [Validators.min(0), Validators.max(50)]],
  });

  /** Starts editing the trainer profile */
  startEdit(): void {
    const t = this.trainer();
    if (t) {
      this.editForm.patchValue({ name: t.name, region: t.region, rank: t.rank, badge_count: t.badge_count });
      this.editing.set(true);
    }
  }

  /** Saves the edited trainer profile */
  saveProfile(): void {
    if (this.editForm.invalid) return;
    const t = this.trainer();
    if (!t) return;
    this.saving.set(true);
    this.store.updateTrainer({ id: t.id, ...this.editForm.value }).subscribe({
      next: () => { this.toastService.success('Profile updated!'); this.editing.set(false); this.saving.set(false); },
      error: () => { this.toastService.error('Failed to update profile.'); this.saving.set(false); },
    });
  }

  /** Switches the active trainer */
  switchTrainer(id: number): void {
    this.store.setCurrentTrainer(id);
    this.editing.set(false);
  }
}
