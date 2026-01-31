import type { Meta, StoryObj } from '@storybook/angular';
import { ScheduleCardComponent } from './schedule-card.component';
import { action } from '@storybook/addon-actions';

/**
 * Schedule Card Stories
 * Fotózás időpontja kártya komponens - Storybook demo
 *
 * Állapotok tesztelése:
 * - Default (üres)
 * - WithSelection/Selected (kitöltött)
 * - DarkMode
 * - Accessibility (a11y)
 * - Loading
 * - Disabled
 */

const meta: Meta<ScheduleCardComponent> = {
  title: 'Shared/Schedule Card',
  component: ScheduleCardComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Fotózás időpontja kártya komponens BEM naming convention-nel.',
      },
    },
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Dátum/idő érték (null = üres state)',
    },
    isLoading: {
      control: 'boolean',
      description: 'Loading állapot (pulse animáció)',
    },
    isDisabled: {
      control: 'boolean',
      description: 'Disabled állapot (inaktív)',
    },
    label: {
      control: 'text',
      description: 'Cím (label)',
    },
    customStatusText: {
      control: 'text',
      description: 'Custom státusz szöveg (opcional)',
    },
    editClick: {
      description: 'Edit button click event',
    },
    cardClick: {
      description: 'Card click event',
    },
  },
};

export default meta;
type Story = StoryObj<ScheduleCardComponent>;

// ============================================================================
// DEFAULT STATE (Üres / Warning)
// ============================================================================

/**
 * Default state: üres, még nincs kitöltve az időpont
 * - Sárga háttér (warning)
 * - Naptár ikon
 * - "Még nincs időpont" szöveg
 * - "Kötelező kitölteni" státusz
 */
export const Default: Story = {
  args: {
    value: null,
    isLoading: false,
    isDisabled: false,
    label: 'Fotózás időpontja',
    customStatusText: null,
    editClick: action('edit-click'),
    cardClick: action('card-click'),
  },
};

// ============================================================================
// SUCCESS STATE (Kitöltött / Selected)
// ============================================================================

/**
 * Success state: kitöltött, van rögzített időpont
 * - Zöld háttér (success)
 * - Checkmark ikon
 * - Dátum/idő szöveg
 * - "Rögzítve" státusz
 */
export const WithSelection: Story = {
  args: {
    ...Default.args,
    value: '2025. március 15. 10:00',
  },
};

/**
 * Alias: Success state
 */
export const Selected: Story = WithSelection;

// ============================================================================
// LOADING STATE
// ============================================================================

/**
 * Loading state: adatok töltödnek
 * - Pulse animáció az ikonnál
 * - Disabled gomb
 */
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
    isDisabled: true,
  },
};

// ============================================================================
// DISABLED STATE
// ============================================================================

/**
 * Disabled state: inaktív, nem kattintható
 * - Szürke megjelenés
 * - Cursor: not-allowed
 * - Gomb inaktív
 */
export const Disabled: Story = {
  args: {
    ...Default.args,
    isDisabled: true,
  },
};

/**
 * Disabled success state
 */
export const DisabledWithValue: Story = {
  args: {
    ...WithSelection.args,
    isDisabled: true,
  },
};

// ============================================================================
// DARK MODE
// ============================================================================

/**
 * Dark mode: üres state
 */
export const DarkModeEmpty: Story = {
  args: Default.args,
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `
        <div style="background: #1f2937; padding: 2rem; border-radius: 0.5rem; min-height: 150px; display: flex; align-items: center;">
          ${story.template}
        </div>
      `,
      props: story.props,
    }),
  ],
};

/**
 * Dark mode: kitöltött state
 */
export const DarkModeSelected: Story = {
  args: WithSelection.args,
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `
        <div style="background: #1f2937; padding: 2rem; border-radius: 0.5rem; min-height: 150px; display: flex; align-items: center;">
          ${story.template}
        </div>
      `,
      props: story.props,
    }),
  ],
};

// ============================================================================
// RESPONSIVE / MOBILE
// ============================================================================

/**
 * Mobile layout (max-width: 640px)
 * - Stack layout (vertical)
 * - Kisebb icon
 * - Full width gomb
 */
export const Mobile: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

/**
 * Mobile with value
 */
export const MobileWithValue: Story = {
  args: WithSelection.args,
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
 * - Vastagabb border
 * - Boldabb szöveg
 */
export const A11yHighContrast: Story = {
  args: WithSelection.args,
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
 * - Nincs animáció
 * - Stabil megjelenés
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
 */
export const A11yKeyboardNav: Story = {
  args: WithSelection.args,
  parameters: {
    docs: {
      description: {
        story: 'Tesztelés Tab billentyűvel: edit gomb fókuszálható kell legyen',
      },
    },
  },
};

// ============================================================================
// CUSTOM VARIANTS
// ============================================================================

/**
 * Custom label
 */
export const CustomLabel: Story = {
  args: {
    ...WithSelection.args,
    label: 'Szükséges fotózási dátum',
  },
};

/**
 * Custom status text
 */
export const CustomStatusText: Story = {
  args: {
    ...WithSelection.args,
    customStatusText: 'Előzetes időpont',
  },
};

/**
 * Compact variant
 * - Kisebb padding
 * - Zömt icon
 */
export const Compact: Story = {
  args: WithSelection.args,
  decorators: [
    (story) => ({
      template: `
        <div class="schedule-card--compact">
          ${story.template}
        </div>
      `,
      props: story.props,
    }),
  ],
};

// ============================================================================
// EDGE CASES
// ============================================================================

/**
 * Hosszú dátum szöveg
 * - Text truncate teszt
 */
export const LongDateText: Story = {
  args: {
    ...WithSelection.args,
    value: '2025. március 15. 10:00 - 2025. március 16. 18:00 (szombat és vasárnap)',
  },
};

/**
 * Üres label
 */
export const EmptyLabel: Story = {
  args: {
    ...Default.args,
    label: '',
  },
};

// ============================================================================
// STORY GROUPS
// ============================================================================

/**
 * Composed: Full workflow
 * Teljes workflow: üres -> loading -> kitöltött -> disabled
 */
export const Workflow: Story = {
  render: (args) => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">
        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">1. Üres (Warning)</h3>
          <app-schedule-card [value]="null" [isLoading]="false" [isDisabled]="false"></app-schedule-card>
        </div>

        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">2. Loading</h3>
          <app-schedule-card [value]="null" [isLoading]="true" [isDisabled]="true"></app-schedule-card>
        </div>

        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">3. Kitöltött (Success)</h3>
          <app-schedule-card [value]="'2025. március 15. 10:00'" [isLoading]="false" [isDisabled]="false"></app-schedule-card>
        </div>

        <div>
          <h3 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #6b7280;">4. Disabled</h3>
          <app-schedule-card [value]="'2025. március 15. 10:00'" [isLoading]="false" [isDisabled]="true"></app-schedule-card>
        </div>
      </div>
    `,
    props: args,
  }),
  parameters: {
    layout: 'padded',
  },
};

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * Docs: BEM Classes
 */
export const DocsBEMClasses: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px; font-family: monospace; font-size: 0.875rem; line-height: 1.6; color: #374151;">
        <h3>BEM Classes</h3>

        <div style="margin-bottom: 1.5rem;">
          <strong>.schedule-card</strong><br>
          Block: fő konténer<br>
          <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">display: flex; gap: 1rem;</code>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong>.schedule-card--success</strong><br>
          Modifier: kitöltött állapot<br>
          <code style="background: #ecfdf5; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">background: var(--schedule-card-success-bg);</code>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong>.schedule-card--warning</strong><br>
          Modifier: üres állapot (default)<br>
          <code style="background: #fffbeb; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">background: var(--schedule-card-warning-bg);</code>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong>.schedule-card__icon</strong><br>
          Element: avatar (balra)<br>
          <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">width: 48px; height: 48px;</code>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong>.schedule-card__content</strong><br>
          Element: szöveg konténer<br>
          <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">flex: 1;</code>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <strong>.schedule-card__action</strong><br>
          Element: edit gomb (jobbra)<br>
          <code style="background: #f3f4f6; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">width: 36px; height: 36px;</code>
        </div>
      </div>
    `,
  }),
};

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
            <td style="padding: 0.5rem;"><code>value</code></td>
            <td style="padding: 0.5rem;">string | null</td>
            <td style="padding: 0.5rem;">null</td>
            <td style="padding: 0.5rem;">Dátum/idő érték</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem;"><code>isLoading</code></td>
            <td style="padding: 0.5rem;">boolean</td>
            <td style="padding: 0.5rem;">false</td>
            <td style="padding: 0.5rem;">Loading state</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem;"><code>isDisabled</code></td>
            <td style="padding: 0.5rem;">boolean</td>
            <td style="padding: 0.5rem;">false</td>
            <td style="padding: 0.5rem;">Disabled state</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 0.5rem;"><code>label</code></td>
            <td style="padding: 0.5rem;">string</td>
            <td style="padding: 0.5rem;">'Fotózás időpontja'</td>
            <td style="padding: 0.5rem;">Cím</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem;"><code>customStatusText</code></td>
            <td style="padding: 0.5rem;">string | null</td>
            <td style="padding: 0.5rem;">null</td>
            <td style="padding: 0.5rem;">Custom státusz szöveg</td>
          </tr>
        </table>
      </div>
    `,
  }),
};
