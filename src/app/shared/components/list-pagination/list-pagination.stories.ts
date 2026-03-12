import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ListPaginationComponent } from './list-pagination.component';
import { PsSelectComponent } from '@shared/components/form';

const meta: Meta<ListPaginationComponent> = {
  title: 'Shared/ListPagination',
  component: ListPaginationComponent,
  decorators: [
    moduleMetadata({
      imports: [FormsModule, LucideAngularModule, PsSelectComponent],
    }),
  ],
  tags: ['autodocs'],
  argTypes: {
    currentPage: { control: 'number', description: 'Aktuális oldal' },
    totalPages: { control: 'number', description: 'Összes oldal' },
    totalItems: { control: 'number', description: 'Összes elem' },
    itemLabel: { control: 'text', description: 'Elem típus megnevezése' },
    perPage: { control: 'number', description: 'Elem / oldal' },
  },
};

export default meta;
type Story = StoryObj<ListPaginationComponent>;

/** Default - alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 5,
    totalItems: 98,
    itemLabel: 'elem',
    perPage: 20,
  },
};

/** Sok oldal (1/20) */
export const ManyPages: Story = {
  name: 'Sok oldal (1/20)',
  args: {
    currentPage: 1,
    totalPages: 20,
    totalItems: 394,
    itemLabel: 'fotó',
    perPage: 20,
  },
};

/** Egyetlen oldal (1/1) */
export const SinglePage: Story = {
  name: 'Egyetlen oldal (1/1)',
  args: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 7,
    itemLabel: 'diák',
    perPage: 20,
  },
};

/** Köztes oldal (5/10) */
export const MiddlePage: Story = {
  name: 'Köztes oldal (5/10)',
  args: {
    currentPage: 5,
    totalPages: 10,
    totalItems: 200,
    itemLabel: 'projekt',
    perPage: 20,
  },
};

/** Utolsó oldal */
export const LastPage: Story = {
  name: 'Utolsó oldal',
  args: {
    currentPage: 10,
    totalPages: 10,
    totalItems: 200,
    itemLabel: 'elem',
    perPage: 20,
  },
};

/** Sötét mód */
export const DarkMode: Story = {
  name: 'Sötét mód',
  args: {
    currentPage: 3,
    totalPages: 8,
    totalItems: 156,
    itemLabel: 'kép',
    perPage: 20,
  },
  decorators: [
    () => ({ styles: [':host { background: #1e293b; }'] }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="padding: 20px;">
        <app-list-pagination
          [currentPage]="currentPage"
          [totalPages]="totalPages"
          [totalItems]="totalItems"
          [itemLabel]="itemLabel"
          [perPage]="perPage"
        />
      </div>`,
  }),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

/** Akadálymentesség (A11y) */
export const A11y: Story = {
  name: 'Akadálymentesség',
  args: {
    currentPage: 2,
    totalPages: 5,
    totalItems: 98,
    itemLabel: 'elem',
    perPage: 20,
  },
  render: (args) => ({
    props: args,
    template: `
      <div role="region" aria-label="Lapozó navigáció">
        <app-list-pagination
          [currentPage]="currentPage"
          [totalPages]="totalPages"
          [totalItems]="totalItems"
          [itemLabel]="itemLabel"
          [perPage]="perPage"
        />
      </div>`,
  }),
};
