import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, LayoutGrid, List, Table } from 'lucide-angular';
import { ViewModeToggleComponent } from './view-mode-toggle.component';

const meta: Meta<ViewModeToggleComponent> = {
  title: 'Shared/UI/ViewModeToggle',
  component: ViewModeToggleComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        ViewModeToggleComponent,
        LucideAngularModule.pick({ LayoutGrid, List, Table }),
      ],
    }),
  ],
  argTypes: {
    value: {
      control: 'text',
      description: 'Aktuális kiválasztott érték',
    },
  },
};

export default meta;
type Story = StoryObj<ViewModeToggleComponent>;

/** Alapértelmezett - rács/lista nézet */
export const Default: Story = {
  args: {
    options: [
      { value: 'grid', label: 'Rács', icon: 'layout-grid' },
      { value: 'list', label: 'Lista', icon: 'list' },
    ],
    value: 'grid',
  },
};

/** Lista kiválasztva */
export const ListSelected: Story = {
  args: {
    options: [
      { value: 'grid', label: 'Rács', icon: 'layout-grid' },
      { value: 'list', label: 'Lista', icon: 'list' },
    ],
    value: 'list',
  },
};

/** Három nézet mód */
export const ThreeOptions: Story = {
  args: {
    options: [
      { value: 'grid', label: 'Rács', icon: 'layout-grid' },
      { value: 'list', label: 'Lista', icon: 'list' },
      { value: 'table', label: 'Táblázat', icon: 'table' },
    ],
    value: 'grid',
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    options: [
      { value: 'grid', label: 'Rács', icon: 'layout-grid' },
      { value: 'list', label: 'Lista', icon: 'list' },
    ],
    value: 'grid',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
