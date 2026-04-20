import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Skeleton shimmer loader component.
 * Displays an animated placeholder while content is loading.
 * Uses CSS keyframes for the shimmer effect.
 *
 * @example <app-skeleton-loader />
 */
@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton-container">
      <div class="skeleton-image"></div>
      <div class="skeleton-lines">
        <div class="skeleton-line w-70"></div>
        <div class="skeleton-line w-50"></div>
        <div class="skeleton-line w-30"></div>
      </div>
    </div>
  `,
  styles: [`
    .skeleton-container {
      background: var(--card-bg, #1a1a2e);
      border-radius: 12px;
      padding: 16px;
      overflow: hidden;
    }

    .skeleton-image {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      margin: 0 auto 12px;
      background: linear-gradient(90deg, #1e1e3a 25%, #2a2a4a 50%, #1e1e3a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-line {
      height: 12px;
      border-radius: 6px;
      margin-bottom: 8px;
      background: linear-gradient(90deg, #1e1e3a 25%, #2a2a4a 50%, #1e1e3a 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-line.w-70 { width: 70%; }
    .skeleton-line.w-50 { width: 50%; }
    .skeleton-line.w-30 { width: 30%; }

    .skeleton-lines {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `],
})
export class SkeletonLoaderComponent {}
