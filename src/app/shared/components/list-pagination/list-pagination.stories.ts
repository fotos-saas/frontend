import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ListPaginationComponent } from './list-pagination.component';

const meta: Meta<ListPaginationComponent> = {
  title: 'Shared/UI/ListPagination',
  component: ListPaginationComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        ListPaginationComponent,
        FormsModule,
        LucideAngularModule.pick({ ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight }),
      ],
    }),
  ],
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Aktuális oldal',
    },
    totalPages: {
      control: { type: 'number', min: 1, max: 100 },
      description: 'Összes oldal',
    },
    totalItems: {
      control: { type: 'number', min: 0, max: 10000 },
      description: 'Összes elem',
    },
    itemLabel: {
      control: 'text',
      description: 'Elem típus címke',
    },
  },
};

export default meta;
type Story = StoryObj<ListPaginationComponent>;

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 245,
    itemLabel: 'elem',
  },
};

/** Középső oldal */
export const MiddlePage: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    totalItems: 245,
    itemLabel: 'elem',
  },
};

/** Utolsó oldal */
export const LastPage: Story = {
  args: {
    currentPage: 10,
    totalPages: 10,
    totalItems: 245,
    itemLabel: 'elem',
  },
};

/** Egyetlen oldal */
export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 12,
    itemLabel: 'projekt',
  },
};

/** Sok oldal */
export const ManyPages: Story = {
  args: {
    currentPage: 42,
    totalPages: 85,
    totalItems: 2125,
    itemLabel: 'kép',
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
    totalItems: 245,
    itemLabel: 'elem',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
