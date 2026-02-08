import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import {
  LucideAngularModule,
  Search, X, Loader2, FileSpreadsheet, Archive,
  CheckCircle, Circle, AlertTriangle, Users,
} from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { GalleryMonitoringComponent } from './gallery-monitoring.component';
import { GalleryMonitoringState } from './gallery-monitoring.state';
import type { MonitoringPerson, MonitoringSummary } from '../../../../models/gallery-monitoring.models';

// --- Mock adatok ---

const mockSummary: MonitoringSummary = {
  totalPersons: 30,
  opened: 22,
  notOpened: 8,
  finalized: 15,
  inProgress: 7,
  staleCount: 3,
};

const mockPersons: MonitoringPerson[] = [
  { personId: 1, name: 'Antal Bence', type: 'student', hasOpened: true, lastActivityAt: '2026-02-07T10:30:00Z', currentStep: 'completed', workflowStatus: 'finalized', retouchCount: 5, hasTabloPhoto: true, finalizedAt: '2026-02-07T10:30:00Z', daysSinceLastActivity: 1, staleWarning: false },
  { personId: 2, name: 'Berkes Csaba', type: 'student', hasOpened: true, lastActivityAt: '2026-02-05T14:00:00Z', currentStep: 'retouch', workflowStatus: 'in_progress', retouchCount: 3, hasTabloPhoto: false, finalizedAt: null, daysSinceLastActivity: 3, staleWarning: false },
  { personId: 3, name: 'Deli Emma', type: 'student', hasOpened: true, lastActivityAt: '2026-01-30T08:00:00Z', currentStep: 'tablo', workflowStatus: 'in_progress', retouchCount: 2, hasTabloPhoto: true, finalizedAt: null, daysSinceLastActivity: 9, staleWarning: true },
  { personId: 4, name: 'Farkas Gábor', type: 'teacher', hasOpened: true, lastActivityAt: '2026-02-06T16:45:00Z', currentStep: 'completed', workflowStatus: 'finalized', retouchCount: 0, hasTabloPhoto: true, finalizedAt: '2026-02-06T16:45:00Z', daysSinceLastActivity: 2, staleWarning: false },
  { personId: 5, name: 'Horváth Ilona', type: 'student', hasOpened: false, lastActivityAt: null, currentStep: null, workflowStatus: null, retouchCount: 0, hasTabloPhoto: false, finalizedAt: null, daysSinceLastActivity: null, staleWarning: false },
  { personId: 6, name: 'Kiss Anna', type: 'student', hasOpened: true, lastActivityAt: '2026-02-01T12:00:00Z', currentStep: 'claiming', workflowStatus: 'in_progress', retouchCount: 0, hasTabloPhoto: false, finalizedAt: null, daysSinceLastActivity: 7, staleWarning: true },
  { personId: 7, name: 'Nagy Péter', type: 'student', hasOpened: true, lastActivityAt: '2026-02-07T09:00:00Z', currentStep: 'completed', workflowStatus: 'finalized', retouchCount: 4, hasTabloPhoto: true, finalizedAt: '2026-02-07T09:00:00Z', daysSinceLastActivity: 1, staleWarning: false },
];

const meta: Meta<GalleryMonitoringComponent> = {
  title: 'Partner/GalleryMonitoring',
  component: GalleryMonitoringComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({
          Search, X, Loader2, FileSpreadsheet, Archive,
          CheckCircle, Circle, AlertTriangle, Users,
        }),
        MatTooltipModule,
      ],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj<GalleryMonitoringComponent>;

/** Helper: State injektálás mock adatokkal */
function createStateDecorator(persons: MonitoringPerson[], summary: MonitoringSummary) {
  return (storyFn: any) => {
    const story = storyFn();
    // A komponens ngOnInit-jében töltődne be az adat,
    // de a story-ban közvetlenül állítjuk be a state-et
    setTimeout(() => {
      const comp = document.querySelector('app-gallery-monitoring') as any;
      if (comp?.__ngContext__) {
        // State manuális beállítás nem lehetséges kívülről,
        // ezért a state.setData-t az ngOnInit felülírásával oldjuk meg
      }
    });
    return story;
  };
}

/**
 * Default - Betöltött állapot mock adatokkal.
 *
 * MEGJEGYZÉS: Ez a komponens HTTP-hívásokat végez ngOnInit-ben,
 * Storybook-ban a betöltés sikertelen lesz (nincs backend),
 * így a loading/error állapot jelenik meg.
 * A vizuális teszteléshez használj Chromatic-ot vagy a dev szervert.
 */
export const Default: Story = {
  args: {
    projectId: 1,
  },
};

/** Loading - Skeleton loading állapot */
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="max-width: 900px;">
        <div style="display: flex; flex-wrap: wrap; margin: -6px; margin-bottom: 24px;">
          <div style="flex: 1 1 120px; min-width: 120px; margin: 6px; padding: 16px; height: 80px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
          <div style="flex: 1 1 120px; min-width: 120px; margin: 6px; padding: 16px; height: 80px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
          <div style="flex: 1 1 120px; min-width: 120px; margin: 6px; padding: 16px; height: 80px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
          <div style="flex: 1 1 120px; min-width: 120px; margin: 6px; padding: 16px; height: 80px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
        </div>
        <div style="height: 48px; margin-bottom: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
        <div style="height: 48px; margin-bottom: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
        <div style="height: 48px; margin-bottom: 4px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 10px;"></div>
      </div>
      <style>
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>
    `,
  }),
};

/** Empty - Nincs találat állapot */
export const Empty: Story = {
  render: () => ({
    props: { ICONS: { USERS: 'users' } },
    template: `
      <div style="max-width: 900px;">
        <div style="display: flex; flex-direction: column; align-items: center; padding: 60px 20px; color: #94a3b8;">
          <lucide-icon name="users" [size]="48" style="margin-bottom: 16px; opacity: 0.5;" />
          <h3 style="margin: 0 0 8px; font-size: 1.125rem; color: #64748b;">Nincs találat</h3>
          <p style="margin: 0; font-size: 0.875rem;">A keresési feltételeknek egyetlen személy sem felel meg.</p>
        </div>
      </div>
    `,
  }),
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ Users })],
    }),
  ],
};

/** DarkMode - Sötét háttéren */
export const DarkMode: Story = {
  args: { projectId: 1 },
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 20px; background: #1e293b; border-radius: 12px;">
        <app-gallery-monitoring [projectId]="1" />
      </div>
    `,
  }),
};
