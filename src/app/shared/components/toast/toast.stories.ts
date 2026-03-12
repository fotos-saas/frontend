import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { Component, inject } from '@angular/core';

/**
 * Wrapper komponens a toast story-khoz.
 * Trigger gombokat biztosit a kulonbozo toast tipusokhoz.
 */
@Component({
  selector: 'app-toast-story-wrapper',
  standalone: true,
  imports: [ToastComponent],
  template: `
    <div style="padding: 2rem;">
      <div style="display: flex; flex-wrap: wrap; margin: -4px;">
        <button (click)="showSuccess()" style="margin: 4px; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #22c55e; color: white; cursor: pointer; font-size: 0.875rem;">
          Sikeres toast
        </button>
        <button (click)="showError()" style="margin: 4px; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #ef4444; color: white; cursor: pointer; font-size: 0.875rem;">
          Hiba toast
        </button>
        <button (click)="showWarning()" style="margin: 4px; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #f59e0b; color: white; cursor: pointer; font-size: 0.875rem;">
          Figyelmeztetes toast
        </button>
        <button (click)="showInfo()" style="margin: 4px; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; background: #3b82f6; color: white; cursor: pointer; font-size: 0.875rem;">
          Info toast
        </button>
      </div>
      <p style="color: #9ca3af; font-size: 0.8125rem; margin-top: 1rem;">Kattints egy gombra a toast megjelenitéséhez. A toast 2.5 mp utan automatikusan eltűnik.</p>
      <app-toast />
    </div>
  `,
})
class ToastStoryWrapperComponent {
  private readonly toastService = inject(ToastService);

  showSuccess(): void {
    this.toastService.success('Sikeres mentes', 'A beallitasok mentesre kerultek.');
  }

  showError(): void {
    this.toastService.error('Hiba tortent', 'Nem sikerult kapcsolodni a szerverhez.');
  }

  showWarning(): void {
    this.toastService.warning('Figyelmeztetes', 'A tarhely majdnem megtelt.');
  }

  showInfo(): void {
    this.toastService.info('Informacio', 'Uj verzio erheto el.');
  }
}

/**
 * Wrapper amivel a toast azonnal megjelenik (auto-trigger).
 */
@Component({
  selector: 'app-toast-auto-wrapper',
  standalone: true,
  imports: [ToastComponent],
  template: `<app-toast />`,
})
class ToastAutoWrapperComponent {
  private readonly toastService = inject(ToastService);

  constructor() {
    // Kis kesleltetes a rendereles utan
    setTimeout(() => this.trigger(), 100);
  }

  type: 'success' | 'error' | 'warning' | 'info' = 'success';

  trigger(): void {
    switch (this.type) {
      case 'success':
        this.toastService.success('Sikeres mentes', 'A beallitasok mentesre kerultek.');
        break;
      case 'error':
        this.toastService.error('Hiba tortent', 'Nem sikerult kapcsolodni a szerverhez. Kerlek probald ujra kesobb.');
        break;
      case 'warning':
        this.toastService.warning('Figyelmeztetes', 'A tarhely 90%-ban megtelt. Fontold meg a bovites.');
        break;
      case 'info':
        this.toastService.info('Uj verzio', 'Az alkalmazas v2.5.0 verzioja erheto el.');
        break;
    }
  }
}

/**
 * ## Toast
 *
 * Globalis toast ertesitesek megjelenitese.
 *
 * ### Jellemzok:
 * - 4 tipus: success (zold), error (piros), warning (sarga), info (kek)
 * - Automatikus eltunes (2.5s / 4s hiba eseten)
 * - Kattintasra bezarhato
 * - Animalt be/ki (slide up + fade)
 * - Mobil responsive
 * - ARIA role="alert" + aria-live="polite"
 */
const meta: Meta<ToastStoryWrapperComponent> = {
  title: 'Shared/Toast',
  component: ToastStoryWrapperComponent,
  decorators: [
    moduleMetadata({
      imports: [ToastStoryWrapperComponent, ToastAutoWrapperComponent, ToastComponent],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f8fafc' },
        { name: 'dark', value: '#1e293b' },
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ToastStoryWrapperComponent>;

// ============================================================================
// ALAP - INTERAKTIV
// ============================================================================

/**
 * Default - Interaktiv demo (kattints a gombokra)
 */
export const Default: Story = {};

// ============================================================================
// TOAST TIPUSOK (auto-trigger)
// ============================================================================

/**
 * Success - Sikeres toast
 */
export const Success: Story = {
  render: () => ({
    template: `<app-toast-auto-wrapper [type]="'success'" />`,
    props: {},
  }),
};

/**
 * Error - Hiba toast
 */
export const Error: Story = {
  render: () => ({
    template: `<app-toast-auto-wrapper [type]="'error'" />`,
    props: {},
  }),
};

/**
 * Warning - Figyelmeztetes toast
 */
export const WarningToast: Story = {
  render: () => ({
    template: `<app-toast-auto-wrapper [type]="'warning'" />`,
    props: {},
  }),
};

/**
 * Info - Informacios toast
 */
export const InfoToast: Story = {
  render: () => ({
    template: `<app-toast-auto-wrapper [type]="'info'" />`,
    props: {},
  }),
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/**
 * DarkMode - Sotet hatter
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => ({
    template: `
      <div style="padding: 2rem; min-height: 300px;">
        <p style="color: #9ca3af; font-size: 0.875rem;">A toast komponens sotet hatterrel is jol lathato (feher hatter + arnyekolas).</p>
        <app-toast-auto-wrapper [type]="'success'" />
      </div>
    `,
    props: {},
  }),
};

/**
 * A11y - Akadalymentesseg
 */
export const A11y: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A toast ARIA role="alert" es aria-live="polite" attributumokkal rendelkezik. Kepernyoolvasok automatikusan felolvassak a toast tartalmat.',
      },
    },
  },
  render: () => ({
    template: `
      <div style="padding: 2rem; min-height: 300px;">
        <p style="color: #374151; font-size: 0.875rem; margin-bottom: 1rem;">
          A toast komponens akadalymentes: role="alert", aria-live="polite" attributumok.
          Kattintasra bezarhato, automatikusan eltunik.
        </p>
        <app-toast-auto-wrapper [type]="'info'" />
      </div>
    `,
    props: {},
  }),
};
