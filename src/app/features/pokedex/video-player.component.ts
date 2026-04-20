import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { PokemonSpritePipe } from '../../pipes/pokemon-sprite.pipe';

/** Static map of Pokémon IDs to YouTube video IDs */
const VIDEO_MAP: Record<number, string> = {
  25: 'rg6CiPI6h2g',  // Pikachu
  6: '0vRxMVHxjEA',   // Charizard
  150: 'VrMI7e0gPo0',  // Mewtwo
  1: 'bRWMFYregCY',    // Bulbasaur
  9: 'mRfSM5MobT4',   // Blastoise
};
const FALLBACK_VIDEO = 'rg6CiPI6h2g';

/**
 * Video player component for the Pokémon detail panel.
 * Embeds a YouTube iframe using DomSanitizer for trusted URLs.
 * Falls back to official artwork with "No video available" text.
 */
@Component({
  selector: 'app-video-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PokemonSpritePipe],
  template: `
    <div class="video-section" id="video-player-section">
      <h3>Video</h3>
      @if (getVideoUrl(); as url) {
        <div class="video-wrapper">
          <iframe
            [src]="url"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            class="video-iframe"
            id="video-iframe"
          ></iframe>
          @if (showOverlay()) {
            <div class="play-overlay" (click)="showOverlay.set(false)" id="play-overlay">
              <div class="play-icon">▶</div>
            </div>
          }
        </div>
      } @else {
        <div class="no-video">
          <img [src]="pokemonId() | pokemonSprite:'artwork'" [alt]="pokemonName()" class="fallback-art" />
          <p>No video available</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .video-section h3 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 8px; }
    .video-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; border-radius: 12px; overflow: hidden; background: #000; }
    .video-iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
    .play-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
    .play-overlay:hover { background: rgba(0,0,0,0.2); }
    .play-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.9); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #333; }
    .no-video { text-align: center; padding: 24px; background: var(--card-bg); border-radius: 12px; border: 1px dashed var(--border-color); }
    .fallback-art { width: 120px; height: 120px; opacity: 0.6; }
    .no-video p { color: var(--text-secondary); margin-top: 8px; font-size: 0.85rem; }
  `],
})
export class VideoPlayerComponent {
  readonly pokemonId = input.required<number>();
  readonly pokemonName = input.required<string>();
  readonly showOverlay = signal(true);
  private readonly sanitizer = inject(DomSanitizer);

  /**
   * Returns a sanitized YouTube embed URL if a video is mapped, otherwise null.
   * @returns SafeResourceUrl or null
   */
  getVideoUrl(): SafeResourceUrl | null {
    const videoId = VIDEO_MAP[this.pokemonId()];
    if (!videoId) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
  }
}
