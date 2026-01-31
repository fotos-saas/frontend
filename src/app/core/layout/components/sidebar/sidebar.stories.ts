import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { SidebarComponent } from './sidebar.component';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuConfigService } from '../../services/menu-config.service';
import { signal } from '@angular/core';

/**
 * Sidebar Component
 *
 * Desktop/tablet sidebar navigáció.
 * - Desktop (1024px+): 240px széles, teljes label-ek
 * - Tablet (768-1023px): 60px széles, csak ikonok + tooltip
 */
const meta: Meta<SidebarComponent> = {
  title: 'Layout/Sidebar',
  component: SidebarComponent,
  decorators: [
    moduleMetadata({
      imports: [RouterTestingModule],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
    },
  },
};

export default meta;
type Story = StoryObj<SidebarComponent>;

/**
 * Default - Expanded desktop mód
 */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isTablet: signal(false),
            isMobile: signal(false),
            isOpen: signal(false),
            expandedSections: signal(['tablo']),
            isSectionExpanded: (id: string) => id === 'tablo',
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="min-h-screen bg-gray-100 pt-16">
        <app-sidebar />
      </div>
    `,
  }),
};

/**
 * Collapsed - Tablet mód (csak ikonok)
 */
export const Collapsed: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isTablet: signal(true),
            isMobile: signal(false),
            isOpen: signal(false),
            expandedSections: signal([]),
            isSectionExpanded: () => false,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="min-h-screen bg-gray-100 pt-16">
        <app-sidebar />
      </div>
    `,
  }),
};

/**
 * WithExpandedSections - Több szekció kibontva
 */
export const WithExpandedSections: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isTablet: signal(false),
            isMobile: signal(false),
            isOpen: signal(false),
            expandedSections: signal(['tablo', 'order']),
            isSectionExpanded: (id: string) => ['tablo', 'order'].includes(id),
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="min-h-screen bg-gray-100 pt-16">
        <app-sidebar />
      </div>
    `,
  }),
};

/**
 * DarkMode - Sötét háttérrel
 */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isTablet: signal(false),
            isMobile: signal(false),
            isOpen: signal(false),
            expandedSections: signal(['tablo']),
            isSectionExpanded: (id: string) => id === 'tablo',
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  render: () => ({
    template: `
      <div class="min-h-screen bg-gray-900 pt-16">
        <app-sidebar />
      </div>
    `,
  }),
};
