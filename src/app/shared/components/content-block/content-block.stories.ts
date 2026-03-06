import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ContentBlockComponent } from './content-block.component';

const meta: Meta<ContentBlockComponent> = {
  title: 'Shared/Content/ContentBlock',
  component: ContentBlockComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ContentBlockComponent],
    }),
  ],
  argTypes: {
    title: { control: 'text', description: 'Cím' },
    content: { control: 'text', description: 'HTML tartalom' },
    collapsedHeight: { control: 'number', description: 'Összecsukott magasság (px)' },
    tolerancePercent: { control: 'number', description: 'Tűréshatár (%)' },
    expandLabel: { control: 'text', description: 'Kinyitás gomb felirat' },
    collapseLabel: { control: 'text', description: 'Összecsukás gomb felirat' },
  },
};

export default meta;
type Story = StoryObj<ContentBlockComponent>;

const ROVID_TARTALOM = '<p>Ez egy rövid tartalom, ami belefér a collapsed magasságba.</p>';
const HOSSZU_TARTALOM = `
  <p>Ez egy hosszú tartalom, ami nem fér bele a collapsed magasságba és szükség van a "Tovább olvasom" gombra.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
  <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
  <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
`;

/** Alapértelmezett - rövid tartalom */
export const Default: Story = {
  args: {
    title: 'Bejegyzés címe',
    content: ROVID_TARTALOM,
    collapsedHeight: 100,
  },
};

/** Hosszú tartalom - expand gombbal */
export const HosszuTartalom: Story = {
  args: {
    title: 'Részletes leírás',
    content: HOSSZU_TARTALOM,
    collapsedHeight: 100,
  },
};

/** Egyedi gomb feliratok */
export const EgyediGombFeliratok: Story = {
  args: {
    title: 'Tudnivalók',
    content: HOSSZU_TARTALOM,
    collapsedHeight: 80,
    expandLabel: 'Mutass többet',
    collapseLabel: 'Elrejtés',
  },
};

/** Tartalom nélkül */
export const TartalomNelkul: Story = {
  args: {
    title: 'Üres blokk',
    content: null,
    collapsedHeight: 100,
  },
};
