import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { ExpandableContentComponent } from './expandable-content.component';

const meta: Meta<ExpandableContentComponent> = {
  title: 'Shared/Content/ExpandableContent',
  component: ExpandableContentComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [ExpandableContentComponent],
    }),
  ],
  argTypes: {
    title: { control: 'text', description: 'Opcionális cím' },
    content: { control: 'text', description: 'HTML tartalom' },
    collapsedHeight: { control: 'number', description: 'Összecsukott magasság (px)' },
    tolerancePercent: { control: 'number', description: 'Tűréshatár (%)' },
    expandLabel: { control: 'text', description: 'Kinyitás gomb felirat' },
    collapseLabel: { control: 'text', description: 'Összecsukás gomb felirat' },
  },
};

export default meta;
type Story = StoryObj<ExpandableContentComponent>;

const ROVID = '<p>Rövid tartalom, ami belefér.</p>';
const HOSSZU = `
  <p><strong>Fontos információ:</strong> Ez egy hosszabb szöveg, ami túlnyúlik a collapsed magasságon.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum.</p>
  <ul>
    <li>Első elem</li>
    <li>Második elem</li>
    <li>Harmadik elem</li>
  </ul>
  <p>Cras mattis consectetur purus sit amet fermentum. Donec sed odio dui.</p>
  <blockquote>Idézet: Nullam quis risus eget urna mollis ornare vel eu leo.</blockquote>
  <p>Maecenas faucibus mollis interdum. Praesent commodo cursus magna.</p>
`;

/** Alapértelmezett - rövid tartalom, nem kell expand */
export const Default: Story = {
  args: {
    content: ROVID,
    collapsedHeight: 100,
  },
};

/** Hosszú tartalom - expand gombbal */
export const HosszuTartalom: Story = {
  args: {
    content: HOSSZU,
    collapsedHeight: 100,
  },
};

/** Címmel */
export const Cimmel: Story = {
  args: {
    title: 'Részletek',
    content: HOSSZU,
    collapsedHeight: 80,
  },
};

/** Alacsony tűréshatár */
export const AlacsonyTuresHatar: Story = {
  args: {
    content: HOSSZU,
    collapsedHeight: 60,
    tolerancePercent: 5,
  },
};

/** Egyedi feliratokkal */
export const EgyediFeliratokkal: Story = {
  args: {
    content: HOSSZU,
    collapsedHeight: 80,
    expandLabel: 'Bővebben...',
    collapseLabel: 'Kevesebbet mutat',
  },
};
