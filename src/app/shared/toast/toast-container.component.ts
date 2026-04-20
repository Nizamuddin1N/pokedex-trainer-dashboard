import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Toast container component that renders all active toast notifications.
 * Positioned fixed at the top-right of the viewport with slide-in animations.
 *
 * @example Place once in app root: <app-toast-container />
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-container" id="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast toast-{{ toast.type }}"
          (click)="toastService.dismiss(toast.id)"
          [id]="'toast-' + toast.id"
        >
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @default { ℹ }
            }
          </span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 380px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 18px;
      border-radius: 10px;
      color: #fff;
      font-size: 0.85rem;
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s, opacity 0.2s;
    }

    .toast:hover {
      transform: translateX(-4px);
    }

    .toast-success {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9));
    }

    .toast-error {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
    }

    .toast-warning {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9));
    }

    .toast-info {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9));
    }

    .toast-icon {
      font-size: 1.1rem;
      font-weight: 700;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `],
})
export class ToastContainerComponent {
  /** Toast service for reading and dismissing toasts */
  readonly toastService = inject(ToastService);
}
