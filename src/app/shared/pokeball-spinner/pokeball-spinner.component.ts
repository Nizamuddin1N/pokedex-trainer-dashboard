import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Animated Pokéball spinner shown during loading states.
 * Uses CSS keyframes for the spinning animation.
 *
 * @example <app-pokeball-spinner />
 */
@Component({
  selector: 'app-pokeball-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pokeball-wrapper">
      <div class="pokeball">
        <div class="pokeball-top"></div>
        <div class="pokeball-center">
          <div class="pokeball-button"></div>
        </div>
        <div class="pokeball-bottom"></div>
      </div>
      <p class="loading-text">Loading...</p>
    </div>
  `,
  styles: [`
    .pokeball-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .pokeball {
      width: 60px;
      height: 60px;
      position: relative;
      animation: spin 1s ease-in-out infinite, bounce 0.6s ease-in-out infinite alternate;
    }

    .pokeball-top {
      position: absolute;
      top: 0;
      width: 60px;
      height: 30px;
      background: #ee1515;
      border-radius: 30px 30px 0 0;
      border: 3px solid #222;
      border-bottom: none;
    }

    .pokeball-bottom {
      position: absolute;
      bottom: 0;
      width: 60px;
      height: 30px;
      background: #fff;
      border-radius: 0 0 30px 30px;
      border: 3px solid #222;
      border-top: none;
    }

    .pokeball-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 66px;
      height: 6px;
      background: #222;
      z-index: 2;
    }

    .pokeball-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      background: #fff;
      border: 3px solid #222;
      border-radius: 50%;
      z-index: 3;
    }

    .pokeball-button::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: #fff;
      border: 2px solid #222;
      border-radius: 50%;
    }

    .loading-text {
      margin-top: 16px;
      color: var(--text-secondary, #888);
      font-size: 0.85rem;
      letter-spacing: 2px;
      text-transform: uppercase;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes bounce {
      0% { transform: translateY(0) rotate(0deg); }
      100% { transform: translateY(-10px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `],
})
export class PokeballSpinnerComponent {}
