import { Injectable, signal, computed } from '@angular/core';

/**
 * Represents a toast notification with message, type, and auto-dismiss timing.
 */
export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

/**
 * Service for managing toast notifications.
 * Uses signals for reactive state that integrates cleanly with OnPush components.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Internal signal holding active toasts */
  private readonly _toasts = signal<Toast[]>([]);

  /** Counter for unique toast IDs */
  private nextId = 0;

  /** Public readonly signal of active toasts */
  readonly toasts = computed(() => this._toasts());

  /**
   * Shows a new toast notification.
   * Auto-dismisses after the specified duration.
   *
   * @param message - The message to display
   * @param type - Toast type for styling (success, error, info, warning)
   * @param duration - Auto-dismiss duration in milliseconds (default: 4000)
   */
  show(message: string, type: Toast['type'] = 'info', duration: number = 4000): void {
    const id = this.nextId++;
    const toast: Toast = { id, message, type, duration };
    this._toasts.update(t => [...t, toast]);

    setTimeout(() => this.dismiss(id), duration);
  }

  /**
   * Dismisses a toast by its ID.
   *
   * @param id - The toast ID to remove
   */
  dismiss(id: number): void {
    this._toasts.update(t => t.filter(toast => toast.id !== id));
  }

  /**
   * Convenience method: show a success toast.
   *
   * @param message - Success message text
   */
  success(message: string): void {
    this.show(message, 'success');
  }

  /**
   * Convenience method: show an error toast.
   *
   * @param message - Error message text
   */
  error(message: string): void {
    this.show(message, 'error', 6000);
  }

  /**
   * Convenience method: show a warning toast.
   *
   * @param message - Warning message text
   */
  warning(message: string): void {
    this.show(message, 'warning');
  }
}
