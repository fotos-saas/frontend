import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { SessionChooserComponent } from './session-chooser.component';
import { TabloStorageService, StoredSession } from '../core/services/tablo-storage.service';

// Mock TabloStorageService
class MockTabloStorageService {
  private mockSessions: StoredSession[] = [];

  setMockSessions(sessions: StoredSession[]): void {
    this.mockSessions = sessions;
  }

  getStoredSessions(): StoredSession[] {
    return this.mockSessions;
  }

  getActiveSession(): { projectId: number; sessionType: string } | null {
    return null;
  }

  setActiveSession(projectId: number, sessionType: string): void {
    console.log('setActiveSession called:', projectId, sessionType);
  }

  updateSessionLastUsed(projectId: number, sessionType: string): void {
    console.log('updateSessionLastUsed called:', projectId, sessionType);
  }

  removeSession(projectId: number, sessionType: string): void {
    this.mockSessions = this.mockSessions.filter(
      s => !(s.projectId === projectId && s.sessionType === sessionType)
    );
  }

  clearSessionAuth(projectId: number, sessionType: string): void {
    console.log('clearSessionAuth called:', projectId, sessionType);
  }
}

const meta: Meta<SessionChooserComponent> = {
  title: 'Pages/SessionChooser',
  component: SessionChooserComponent,
  decorators: [
    applicationConfig({
      providers: [provideRouter([])],
    }),
    moduleMetadata({
      providers: [
        { provide: TabloStorageService, useClass: MockTabloStorageService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<SessionChooserComponent>;

// Helper to create mock sessions
const createMockSessions = (count: number): StoredSession[] => {
  const sessions: StoredSession[] = [];
  const types: Array<'code' | 'share' | 'preview'> = ['code', 'share', 'preview'];
  const names = [
    'Solymár Gimnázium',
    'Pécsi Művészeti Gimnázium',
    'Budapesti Műszaki Gimnázium',
    'Debreceni Református Kollégium',
  ];
  const userNames = [
    'Kovács Péter',
    'Kiss Béla (vendég)',
    'Admin előnézet',
    'Nagy Anna',
  ];

  for (let i = 0; i < count; i++) {
    const daysAgo = i * 2;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    sessions.push({
      projectId: i + 1,
      sessionType: types[i % types.length],
      projectName: names[i % names.length],
      userName: userNames[i % userNames.length],
      lastUsed: date.toISOString(),
    });
  }

  return sessions;
};

/**
 * Default: Két session (leggyakoribb eset)
 */
export const Default: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  play: async ({ canvasElement }) => {
    // Set up mock data before component renders
    const service = (canvasElement as any).__ngContext__?.[0]?.get(TabloStorageService);
    if (service instanceof MockTabloStorageService) {
      service.setMockSessions(createMockSessions(2));
    }
  },
};

/**
 * Három session (kapcsolattartó + vendég + preview)
 */
export const ThreeSessions: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions(createMockSessions(3));
            return service;
          },
        },
      ],
    }),
  ],
};

/**
 * Egy session (automatikus belépés - vizuálisan nem fog látszódni)
 */
export const SingleSession: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions(createMockSessions(1));
            return service;
          },
        },
      ],
    }),
  ],
};

/**
 * Sok session (edge case)
 */
export const ManySessions: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions(createMockSessions(6));
            return service;
          },
        },
      ],
    }),
  ],
};

/**
 * Nincs session (átirányít login-ra)
 */
export const NoSessions: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions([]);
            return service;
          },
        },
      ],
    }),
  ],
};

/**
 * Dark mode (prefers-color-scheme: dark)
 * Note: A dark mode még nincs implementálva, de a struktúra készen áll.
 */
export const DarkMode: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions(createMockSessions(2));
            return service;
          },
        },
      ],
    }),
  ],
};

/**
 * Mobile view
 */
export const Mobile: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions(createMockSessions(3));
            return service;
          },
        },
      ],
    }),
  ],
};

/**
 * A11y variant - reduced motion
 */
export const ReducedMotion: Story = {
  render: () => ({
    template: `<app-session-chooser />`,
  }),
  parameters: {
    chromatic: { prefersReducedMotion: 'reduce' },
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: TabloStorageService,
          useFactory: () => {
            const service = new MockTabloStorageService();
            service.setMockSessions(createMockSessions(2));
            return service;
          },
        },
      ],
    }),
  ],
};
