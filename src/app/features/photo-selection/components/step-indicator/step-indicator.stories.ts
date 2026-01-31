import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { StepIndicatorComponent } from './step-indicator.component';
import { ToastService } from '../../../../core/services/toast.service';
import { action } from '@storybook/addon-actions';

/**
 * Step Indicator Stories
 * Vízszintes stepper komponens - Storybook demo
 *
 * Állapotok tesztelése:
 * - Default (1. lépés aktív)
 * - Middle step (2. lépés aktív)
 * - Last step (3. lépés aktív)
 * - Completed (minden befejezve)
 * - DarkMode
 * - Accessibility (a11y)
 *
 * US-004: Info ikon hozzáadva - újra megnyitja az instrukciós dialógust
 */

const meta: Meta<StepIndicatorComponent> = {
  title: 'Photo Selection/Step Indicator',
  component: StepIndicatorComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      providers: [ToastService],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Vízszintes stepper komponens a képválasztási workflow-hoz.

**3 lépés:**
1. Saját képek - Összes kép kijelölése, amelyen te szerepelsz
2. Retusálás - Retusálandó képek kiválasztása
3. Tablókép - Végleges tablókép kiválasztása

**Interakciók:**
- Befejezett lépésekre kattintva visszalépés
- Jövőbeli (disabled) lépésekre kattintva toast figyelmeztetés
- Info ikonra kattintva újra megjelenik az instrukciós dialógus
        `,
      },
    },
  },
  argTypes: {
    currentStep: {
      control: 'select',
      options: ['claiming', 'retouch', 'tablo', 'completed'],
      description: 'Aktuális lépés',
    },
    allowClick: {
      control: 'boolean',
      description: 'Kattintás engedélyezése (visszalépéshez)',
    },
    stepClick: {
      description: 'Lépésre kattintás esemény',
    },
    infoClick: {
      description: 'Info ikon kattintás esemény (újra megnyitja az instrukciós dialógust)',
    },
  },
};

export default meta;
type Story = StoryObj<StepIndicatorComponent>;

// ============================================================================
// DEFAULT STATE (1. lépés - Claiming)
// ============================================================================

/**
 * Default state: 1. lépés (Saját képek) aktív
 * - Első lépés kék kiemelés + pulzáló animáció
 * - Többi lépés szürke (disabled)
 */
export const Default: Story = {
  args: {
    currentStep: 'claiming',
    allowClick: true,
    stepClick: action('step-click'),
    infoClick: action('info-click'),
  },
};

// ============================================================================
// MIDDLE STEP (2. lépés - Retouch)
// ============================================================================

/**
 * Middle step: 2. lépés (Retusálás) aktív
 * - 1. lépés zöld (completed) + pipa ikon + kattintható
 * - 2. lépés kék (active)
 * - 3. lépés szürke (disabled)
 */
export const MiddleStep: Story = {
  args: {
    ...Default.args,
    currentStep: 'retouch',
  },
};

// ============================================================================
// LAST STEP (3. lépés - Tablo)
// ============================================================================

/**
 * Last step: 3. lépés (Tablókép) aktív
 * - 1-2. lépés zöld (completed) + pipa ikon + kattintható
 * - 3. lépés kék (active)
 */
export const LastStep: Story = {
  args: {
    ...Default.args,
    currentStep: 'tablo',
  },
};

// ============================================================================
// COMPLETED STATE
// ============================================================================

/**
 * Completed state: workflow befejezve
 * - Minden lépés zöld (completed) + pipa ikon
 * - Egyik sem kattintható
 */
export const Completed: Story = {
  args: {
    ...Default.args,
    currentStep: 'completed',
  },
};

// ============================================================================
// INFO ICON (US-004)
// ============================================================================

/**
 * Info icon: aktív lépés mellett info ikon
 * - Kattintásra infoClick esemény
 * - Újra megnyitja az instrukciós dialógust
 */
export const WithInfoIcon: Story = {
  args: {
    currentStep: 'retouch',
    allowClick: true,
    stepClick: action('step-click'),
    infoClick: action('info-click'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Az aktív lépés címkéje mellett megjelenik egy info ikon (ⓘ). Kattintásra újra megnyitja az instrukciós dialógust, ami elmagyarázza a lépést.',
      },
    },
  },
};

// ============================================================================
// NO CLICK ALLOWED
// ============================================================================

/**
 * No click allowed: visszalépés letiltva
 * - Befejezett lépések sem kattinthatók
 * - Info ikon továbbra is megjelenik és kattintható
 */
export const NoClickAllowed: Story = {
  args: {
    currentStep: 'tablo',
    allowClick: false,
    stepClick: action('step-click'),
    infoClick: action('info-click'),
  },
};

// ============================================================================
// DARK MODE
// ============================================================================

/**
 * Dark mode: 1. lépés
 */
export const DarkModeFirst: Story = {
  args: Default.args,
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `
        <div style="background: #1f2937; padding: 2rem; border-radius: 0.5rem;">
          <app-step-indicator [currentStep]="currentStep" [allowClick]="allowClick" (stepClick)="stepClick($event)"></app-step-indicator>
        </div>
      `,
      props: story.args,
    }),
  ],
};

/**
 * Dark mode: középső lépés
 */
export const DarkModeMiddle: Story = {
  args: MiddleStep.args,
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `
        <div style="background: #1f2937; padding: 2rem; border-radius: 0.5rem;">
          <app-step-indicator [currentStep]="currentStep" [allowClick]="allowClick" (stepClick)="stepClick($event)"></app-step-indicator>
        </div>
      `,
      props: story.args,
    }),
  ],
};

// ============================================================================
// RESPONSIVE / MOBILE
// ============================================================================

/**
 * Mobile layout
 * - Kisebb körök (36px)
 * - Kisebb label szöveg
 */
export const Mobile: Story = {
  args: MiddleStep.args,
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

// ============================================================================
// ACCESSIBILITY (a11y)
// ============================================================================

/**
 * High contrast mode
 */
export const A11yHighContrast: Story = {
  args: MiddleStep.args,
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};

/**
 * Reduced motion preference
 * - Nincs pulzáló animáció
 */
export const A11yReducedMotion: Story = {
  args: Default.args,
  parameters: {
    prefers: {
      reducedMotion: true,
    },
  },
};

/**
 * Keyboard navigation test
 * - Tab billentyűvel navigálható
 * - Focus visible outline
 */
export const A11yKeyboardNav: Story = {
  args: MiddleStep.args,
  parameters: {
    docs: {
      description: {
        story: 'Tab billentyűvel: befejezett lépések fókuszálhatók, disabled lépések is (toast üzenet jelenik meg kattintásra)',
      },
    },
  },
};

// ============================================================================
// WORKFLOW - Összes állapot egyben
// ============================================================================

/**
 * Workflow: összes állapot egyben
 */
export const Workflow: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 600px;">
        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">1. lépés aktív (Saját képek)</h3>
          <app-step-indicator currentStep="claiming" [allowClick]="true"></app-step-indicator>
        </div>

        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">2. lépés aktív (Retusálás)</h3>
          <app-step-indicator currentStep="retouch" [allowClick]="true"></app-step-indicator>
        </div>

        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">3. lépés aktív (Tablókép)</h3>
          <app-step-indicator currentStep="tablo" [allowClick]="true"></app-step-indicator>
        </div>

        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">Befejezve</h3>
          <app-step-indicator currentStep="completed" [allowClick]="true"></app-step-indicator>
        </div>
      </div>
    `,
  }),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * Docs: Props
 */
export const DocsProps: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px; font-size: 0.875rem; line-height: 1.6; color: #374151;">
        <h3>Props</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <th style="text-align: left; padding: 0.5rem; font-weight: 600;">Prop</th>
            <th style="text-align: left; padding: 0.5rem; font-weight: 600;">Type</th>
            <th style="text-align: left; padding: 0.5rem; font-weight: 600;">Default</th>
            <th style="text-align: left; padding: 0.5rem; font-weight: 600;">Description</th>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem;"><code>currentStep</code></td>
            <td style="padding: 0.5rem;">WorkflowStep</td>
            <td style="padding: 0.5rem;">required</td>
            <td style="padding: 0.5rem;">Aktuális lépés ('claiming' | 'retouch' | 'tablo' | 'completed')</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem;"><code>allowClick</code></td>
            <td style="padding: 0.5rem;">boolean</td>
            <td style="padding: 0.5rem;">true</td>
            <td style="padding: 0.5rem;">Visszalépés engedélyezése</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem;"><code>stepClick</code></td>
            <td style="padding: 0.5rem;">EventEmitter&lt;WorkflowStep&gt;</td>
            <td style="padding: 0.5rem;">-</td>
            <td style="padding: 0.5rem;">Lépésre kattintás esemény</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem;"><code>infoClick</code></td>
            <td style="padding: 0.5rem;">EventEmitter&lt;WorkflowStep&gt;</td>
            <td style="padding: 0.5rem;">-</td>
            <td style="padding: 0.5rem;">Info ikon kattintás esemény (dialógus újra megnyitása)</td>
          </tr>
        </table>

        <h3 style="margin-top: 1.5rem;">Interakciók</h3>
        <ul style="padding-left: 1.5rem;">
          <li><strong>Befejezett (zöld) lépésre kattintás:</strong> visszalépés, stepClick esemény</li>
          <li><strong>Aktív (kék) lépésre kattintás:</strong> semmi nem történik</li>
          <li><strong>Disabled (szürke) lépésre kattintás:</strong> toast figyelmeztetés</li>
          <li><strong>Completed állapotban bármire kattintás:</strong> toast: "Véglegesítve"</li>
          <li><strong>Info ikonra kattintás (aktív lépés mellett):</strong> infoClick esemény, újra megnyitja az instrukciós dialógust</li>
        </ul>
      </div>
    `,
  }),
};
