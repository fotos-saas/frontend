import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { LucideAngularModule, Filter, ChevronUp, ChevronDown, X } from 'lucide-angular';
import { ExpandableFiltersComponent } from './expandable-filters.component';
import { FilterConfig } from './expandable-filters.model';

/**
 * ExpandableFilters - Újrahasználható szűrő komponens
 *
 * Megjeleníti az első N szűrőt inline módon, majd egy "További" gombbal
 * elérhetővé teszi a rejtett szűrőket dropdown panelben.
 */
const meta: Meta<ExpandableFiltersComponent> = {
  title: 'Shared/ExpandableFilters',
  component: ExpandableFiltersComponent,
  decorators: [
    moduleMetadata({
      imports: [
        LucideAngularModule.pick({ Filter, ChevronUp, ChevronDown, X })
      , JsonPipe],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'light',
    },
  },
  argTypes: {
    visibleCount: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Hány szűrő látszik közvetlenül',
    },
  },
};

export default meta;
type Story = StoryObj<ExpandableFiltersComponent>;

// Alapértelmezett szűrő konfigurációk
const defaultFilters: FilterConfig[] = [
  {
    id: 'draft',
    label: 'Draft képek?',
    options: [
      { value: 'true', label: 'Van draft' },
      { value: 'false', label: 'Nincs draft' }
    ]
  },
  {
    id: 'aware',
    label: 'Tudnak róla?',
    options: [
      { value: 'true', label: 'Tudnak róla' },
      { value: 'false', label: 'Nem tudnak róla' }
    ]
  },
  {
    id: 'status',
    label: 'Összes státusz',
    icon: 'filter',
    options: [
      { value: 'not_started', label: 'Nincs elkezdve' },
      { value: 'should_finish', label: 'Be kellene fejeznem' },
      { value: 'waiting_for_response', label: 'Válaszra várok' },
      { value: 'done', label: 'Kész' }
    ]
  }
];

const moreFilters: FilterConfig[] = [
  ...defaultFilters,
  {
    id: 'year',
    label: 'Évfolyam',
    options: [
      { value: '2024', label: '2024' },
      { value: '2025', label: '2025' },
      { value: '2026', label: '2026' }
    ]
  },
  {
    id: 'type',
    label: 'Típus',
    options: [
      { value: 'tablo', label: 'Tabló' },
      { value: 'album', label: 'Album' },
      { value: 'both', label: 'Mindkettő' }
    ]
  }
];

/**
 * Default - 3 szűrő, nincs "További" gomb
 */
export const Default: Story = {
  args: {
    filters: defaultFilters,
    values: {},
    visibleCount: 3,
  },
  render: (args: typeof Default.args) => ({
    props: {
      ...args,
      filterValues: signal<Record<string, string>>({}),
      onFilterChange: function(event: { id: string; value: string }) {
        this.filterValues.update((vals: Record<string, string>) => ({
          ...vals,
          [event.id]: event.value
        }));
      }
    },
    template: `
      <app-expandable-filters
        [filters]="filters"
        [values]="filterValues()"
        [visibleCount]="visibleCount"
        (filterChange)="onFilterChange($event)"
      />
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 0.875rem;">
        <strong>Értékek:</strong> {{ filterValues() | json }}
      </div>
    `,
  }),
};

/**
 * WithMoreFilters - 5 szűrő, "További" gomb látható
 */
export const WithMoreFilters: Story = {
  args: {
    filters: moreFilters,
    values: {},
    visibleCount: 3,
  },
  render: (args: typeof WithMoreFilters.args) => ({
    props: {
      ...args,
      filterValues: signal<Record<string, string>>({}),
      onFilterChange: function(event: { id: string; value: string }) {
        this.filterValues.update((vals: Record<string, string>) => ({
          ...vals,
          [event.id]: event.value
        }));
      }
    },
    template: `
      <app-expandable-filters
        [filters]="filters"
        [values]="filterValues()"
        [visibleCount]="visibleCount"
        (filterChange)="onFilterChange($event)"
      />
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 0.875rem;">
        <strong>Értékek:</strong> {{ filterValues() | json }}
      </div>
    `,
  }),
};

/**
 * WithActiveHiddenFilters - Aktív rejtett szűrők badge-dzsel
 */
export const WithActiveHiddenFilters: Story = {
  args: {
    filters: moreFilters,
    values: { year: '2025', type: 'tablo' },
    visibleCount: 3,
  },
  render: (args: typeof WithActiveHiddenFilters.args) => ({
    props: {
      ...args,
      filterValues: signal<Record<string, string>>(args.values as Record<string, string>),
      onFilterChange: function(event: { id: string; value: string }) {
        this.filterValues.update((vals: Record<string, string>) => ({
          ...vals,
          [event.id]: event.value
        }));
      }
    },
    template: `
      <app-expandable-filters
        [filters]="filters"
        [values]="filterValues()"
        [visibleCount]="visibleCount"
        (filterChange)="onFilterChange($event)"
      />
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 0.875rem;">
        <strong>Értékek:</strong> {{ filterValues() | json }}
      </div>
    `,
  }),
};

/**
 * TwoVisible - Csak 2 szűrő látszik inline
 */
export const TwoVisible: Story = {
  args: {
    filters: moreFilters,
    values: {},
    visibleCount: 2,
  },
  render: (args: typeof TwoVisible.args) => ({
    props: {
      ...args,
      filterValues: signal<Record<string, string>>({}),
      onFilterChange: function(event: { id: string; value: string }) {
        this.filterValues.update((vals: Record<string, string>) => ({
          ...vals,
          [event.id]: event.value
        }));
      }
    },
    template: `
      <app-expandable-filters
        [filters]="filters"
        [values]="filterValues()"
        [visibleCount]="visibleCount"
        (filterChange)="onFilterChange($event)"
      />
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 0.875rem;">
        <strong>Értékek:</strong> {{ filterValues() | json }}
      </div>
    `,
  }),
};

/**
 * DarkMode - Sötét háttéren
 */
export const DarkMode: Story = {
  args: {
    filters: moreFilters,
    values: { status: 'done' },
    visibleCount: 3,
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: (args: typeof DarkMode.args) => ({
    props: {
      ...args,
      filterValues: signal<Record<string, string>>(args.values as Record<string, string>),
      onFilterChange: function(event: { id: string; value: string }) {
        this.filterValues.update((vals: Record<string, string>) => ({
          ...vals,
          [event.id]: event.value
        }));
      }
    },
    template: `
      <div style="padding: 20px; background: #1e293b; border-radius: 12px;">
        <app-expandable-filters
          [filters]="filters"
          [values]="filterValues()"
          [visibleCount]="visibleCount"
          (filterChange)="onFilterChange($event)"
        />
      </div>
    `,
  }),
};
