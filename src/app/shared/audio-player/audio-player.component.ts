import { Component, input, signal, ChangeDetectionStrategy, ElementRef, viewChild } from '@angular/core';

/**
 * Custom audio player for Pokémon cries.
 * Plays the cry audio from PokeAPI/cries with a custom play button.
 *
 * @example <app-audio-player [pokemonId]="25" />
 */
@Component({
  selector: 'app-audio-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="audio-player" id="audio-player">
      <button
        class="play-btn"
        (click)="togglePlay()"
        [class.playing]="isPlaying()"
        id="audio-play-btn"
      >
        @if (isPlaying()) {
          <span class="icon">⏸</span>
        } @else {
          <span class="icon">▶</span>
        }
      </button>
      <div class="waveform">
        @for (bar of waveformBars; track $index) {
          <div
            class="wave-bar"
            [class.active]="isPlaying()"
            [style.animation-delay]="bar.delay + 'ms'"
            [style.height]="bar.height + 'px'"
          ></div>
        }
      </div>
      <span class="cry-label">Cry</span>
      <audio
        #audioElement
        [src]="getCryUrl()"
        (ended)="onEnded()"
        (error)="onError()"
        preload="none"
      ></audio>
    </div>
  `,
  styles: [`
    .audio-player {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.05);
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .play-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .play-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 0 16px rgba(99, 102, 241, 0.5);
    }

    .play-btn .icon {
      font-size: 0.8rem;
    }

    .waveform {
      display: flex;
      align-items: center;
      gap: 2px;
      height: 24px;
    }

    .wave-bar {
      width: 3px;
      background: #6366f1;
      border-radius: 2px;
      transition: height 0.2s;
      opacity: 0.4;
    }

    .wave-bar.active {
      animation: waveAnim 0.5s ease-in-out infinite alternate;
      opacity: 1;
    }

    .cry-label {
      font-size: 0.7rem;
      color: var(--text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    @keyframes waveAnim {
      0% { transform: scaleY(0.4); }
      100% { transform: scaleY(1.2); }
    }
  `],
})
export class AudioPlayerComponent {
  /** The Pokémon ID to play the cry for */
  readonly pokemonId = input.required<number>();

  /** Whether the audio is currently playing */
  readonly isPlaying = signal(false);

  /** Reference to the audio element */
  readonly audioEl = viewChild<ElementRef<HTMLAudioElement>>('audioElement');

  /** Pre-generated waveform bar configurations for visual effect */
  readonly waveformBars = Array.from({ length: 16 }, (_, i) => ({
    delay: i * 60,
    height: 6 + Math.random() * 14,
  }));

  /**
   * Returns the cry audio URL for the current Pokémon.
   *
   * @returns URL to the Pokémon cry OGG file
   */
  getCryUrl(): string {
    return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${this.pokemonId()}.ogg`;
  }

  /**
   * Toggles play/pause state of the cry audio.
   */
  togglePlay(): void {
    const audio = this.audioEl()?.nativeElement;
    if (!audio) return;

    if (this.isPlaying()) {
      audio.pause();
      this.isPlaying.set(false);
    } else {
      audio.play().catch(() => this.isPlaying.set(false));
      this.isPlaying.set(true);
    }
  }

  /**
   * Handles the audio ended event — resets the playing state.
   */
  onEnded(): void {
    this.isPlaying.set(false);
  }

  /**
   * Handles audio loading errors — resets the playing state.
   */
  onError(): void {
    this.isPlaying.set(false);
  }
}
