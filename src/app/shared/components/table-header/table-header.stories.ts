import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, ArrowUp, ArrowDown, Camera, Users } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TableHeaderComponent } from './table-header.component';
import { TableColumn } from './table-header.types';

const meta: Meta<TableHeaderComponent> = {
  title: 'Shared/UI/TableHeader',
  component: TableHeaderComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        TableHeaderComponent,
        LucideAngularModule.pick({ ArrowUp, ArrowDown, Camera, Users }),
        MatTooltipModule,
      ],
    }),
  ],
  argTypes: {
    sortBy: {
      control: 'text',
      description: 'Aktuális rendezés kulcs',
    },
    sortDir: {
      control: 'select',
      options: ['asc', 'desc'],
      description: 'Rendezés irány',
    },
  },
};

export default meta;
type Story = StoryObj<TableHeaderComponent>;

const sampleColumns: TableColumn[] = [
  { key: 'name', label: 'Név', width: '2fr', sortable: true },
  { key: 'school', label: 'Iskola', width: '1.5fr', sortable: true },
  { key: 'status', label: 'Státusz', width: '120px', sortable: false },
  { key: 'photos', label: 'Képek', width: '80px', align: 'center', sortable: true },
  { key: 'actions', label: 'Műveletek', width: '100px', align: 'right', sortable: false },
];

/** Alapértelmezett megjelenés */
export const Default: Story = {
  args: {
    columns: sampleColumns,
    sortBy: '',
    sortDir: 'asc',
  },
};

/** Név szerint rendezve */
export const SortedByName: Story = {
  args: {
    columns: sampleColumns,
    sortBy: 'name',
    sortDir: 'asc',
  },
};

/** Csökkenő rendezés */
export const SortedDescending: Story = {
  args: {
    columns: sampleColumns,
    sortBy: 'photos',
    sortDir: 'desc',
  },
};

/** Ikon oszloppal */
export const WithIconColumn: Story = {
  args: {
    columns: [
      { key: 'name', label: 'Név', width: '2fr', sortable: true },
      { key: 'photos', label: '', width: '60px', align: 'center', sortable: true, icon: 'camera', tooltip: 'Képek száma' },
      { key: 'members', label: '', width: '60px', align: 'center', sortable: false, icon: 'users', tooltip: 'Résztvevők' },
      { key: 'actions', label: 'Műveletek', width: '100px', align: 'right', sortable: false },
    ] as TableColumn[],
    sortBy: 'photos',
    sortDir: 'asc',
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    columns: sampleColumns,
    sortBy: 'name',
    sortDir: 'asc',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
