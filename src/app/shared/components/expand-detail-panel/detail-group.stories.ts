import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { DetailGroupComponent } from './detail-group.component';
import { LucideAngularModule } from 'lucide-angular';

const meta: Meta<DetailGroupComponent> = {
  title: 'Shared/Layout/DetailGroup',
  component: DetailGroupComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [DetailGroupComponent, LucideAngularModule],
    }),
  ],
  argTypes: {
    icon: { control: 'text', description: 'Ikon neve (ICONS konstansból)' },
    label: { control: 'text', description: 'Csoport címke' },
    count: { control: 'number', description: 'Darabszám' },
    countUnit: { control: 'text', description: 'Darabszám egység' },
  },
};

export default meta;
type Story = StoryObj<DetailGroupComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    icon: 'image',
    label: 'Fotók',
    count: null,
    countUnit: 'kép',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-detail-group [icon]="icon" [label]="label" [count]="count" [countUnit]="countUnit">
        <p style="margin: 8px 0 0;">Tartalom a csoportban</p>
      </app-detail-group>
    `,
  }),
};

/** Darabszámmal */
export const Darabszammal: Story = {
  args: {
    icon: 'users',
    label: 'Diákok',
    count: 25,
    countUnit: 'fő',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-detail-group [icon]="icon" [label]="label" [count]="count" [countUnit]="countUnit">
        <p style="margin: 8px 0 0;">Diákok listája itt jelenik meg</p>
      </app-detail-group>
    `,
  }),
};

/** Fájl csoport */
export const FajlCsoport: Story = {
  args: {
    icon: 'file',
    label: 'Csatolmányok',
    count: 3,
    countUnit: 'fájl',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-detail-group [icon]="icon" [label]="label" [count]="count" [countUnit]="countUnit">
        <p style="margin: 8px 0 0;">Fájl lista</p>
      </app-detail-group>
    `,
  }),
};
