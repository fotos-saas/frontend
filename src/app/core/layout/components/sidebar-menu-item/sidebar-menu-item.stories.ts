import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { signal } from '@angular/core';
import { SidebarMenuItemComponent } from './sidebar-menu-item.component';
import { SidebarStateService } from '../../services/sidebar-state.service';
import { MenuItem } from '../../models/menu-item.model';

/**
 * Sidebar Menu Item Component
 *
 * Egyetlen menüelem a sidebar-ban.
 * - Egyszerű item (route + icon + label)
 * - Szekció (children + expand/collapse)
 * - Collapsed mód (csak ikon)
 */
const meta: Meta<SidebarMenuItemComponent> = {
  title: 'Layout/SidebarMenuItem',
  component: SidebarMenuItemComponent,
  decorators: [
    moduleMetadata({
      imports: [RouterTestingModule],
    }),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
  argTypes: {
    collapsed: {
      control: 'boolean',
      description: 'Collapsed mód (csak ikon)',
    },
  },
};

export default meta;
type Story = StoryObj<SidebarMenuItemComponent>;

const simpleItem: MenuItem = {
  id: 'home',
  label: 'kezdőlap',
  icon: '🏠',
  route: '/home',
};

const sectionItem: MenuItem = {
  id: 'tablo',
  label: 'tabló',
  icon: '📸',
  children: [
    { id: 'samples', label: 'minták', route: '/samples' },
    { id: 'persons', label: 'hiányzók', route: '/persons' },
    { id: 'voting', label: 'szavazások', route: '/voting' },
  ],
};

const itemWithBadge: MenuItem = {
  id: 'notifications',
  label: 'értesítések',
  icon: '🔔',
  route: '/notifications',
  badge: 5,
};

/**
 * Default - Egyszerű menüelem
 */
export const Default: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isSectionExpanded: () => false,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    item: simpleItem,
    collapsed: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[240px] bg-gray-50 p-2">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
      </div>
    `,
  }),
};

/**
 * Section - Kibontható szekció
 */
export const Section: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isSectionExpanded: () => true,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    item: sectionItem,
    collapsed: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[240px] bg-gray-50 p-2">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
      </div>
    `,
  }),
};

/**
 * SectionCollapsed - Szekció összecsukott állapotban
 */
export const SectionCollapsed: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isSectionExpanded: () => false,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    item: sectionItem,
    collapsed: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[240px] bg-gray-50 p-2">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
      </div>
    `,
  }),
};

/**
 * WithBadge - Badge-gel
 */
export const WithBadge: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isSectionExpanded: () => false,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    item: itemWithBadge,
    collapsed: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[240px] bg-gray-50 p-2">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
      </div>
    `,
  }),
};

/**
 * CollapsedMode - Tablet mód (csak ikon)
 */
export const CollapsedMode: Story = {
  decorators: [
    moduleMetadata({
      providers: [
        {
          provide: SidebarStateService,
          useValue: {
            isSectionExpanded: () => false,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    item: simpleItem,
    collapsed: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[60px] bg-gray-50 p-1">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
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
            isSectionExpanded: () => false,
            toggleSection: () => {},
          },
        },
      ],
    }),
  ],
  args: {
    item: simpleItem,
    collapsed: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-[240px] bg-gray-800 p-2 rounded">
        <app-sidebar-menu-item [item]="item" [collapsed]="collapsed" />
      </div>
    `,
  }),
};
