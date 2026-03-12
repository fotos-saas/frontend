import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ContentBlockComponent } from './content-block.component';
import { ExpandableContentComponent } from '../expandable-content';

const meta: Meta<ContentBlockComponent> = {
  title: 'Shared/ContentBlock',
  component: ContentBlockComponent,
  decorators: [
    moduleMetadata({
      imports: [ExpandableContentComponent],
    }),
  ],
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: 'Cím (kötelező)' },
    content: { control: 'text', description: 'HTML tartalom' },
    collapsedHeight: { control: 'number', description: 'Összecsukott magasság (px)' },
    tolerancePercent: { control: 'number', description: 'Tűréshatár százalékban' },
    expandLabel: { control: 'text', description: 'Expand gomb felirat' },
    collapseLabel: { control: 'text', description: 'Collapse gomb felirat' },
  },
};

export default meta;
type Story = StoryObj<ContentBlockComponent>;

const SHORT_CONTENT = '<p>Ez egy rövid tartalom, ami belefér a collapsed magasságba.</p>';

const LONG_CONTENT = `
  <p>Ez egy hosszabb tartalom, ami biztosan túlnyúlik az alapértelmezett 100px-es magasságon.</p>
  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>
  <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>
  <p>Sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
  <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
`;

const HTML_CONTENT = `
  <h4>Fontos tudnivalók</h4>
  <ul>
    <li>Első elem a listából</li>
    <li>Második elem <strong>kiemelt szöveggel</strong></li>
    <li>Harmadik elem <a href="#">linkkel</a></li>
  </ul>
  <p>Záró szöveg a tartalom alján, ami további kontextust ad a fentiekhez.</p>
  <p>Még egy bekezdés, hogy biztosan túlnyúljon a collapsed magasságon és megjelenjen a "Tovább olvasom" gomb.</p>
`;

/** Default - rövid tartalom, nincs expand */
export const Default: Story = {
  args: {
    title: 'Bejegyzés címe',
    content: SHORT_CONTENT,
    collapsedHeight: 100,
    tolerancePercent: 20,
    expandLabel: 'Tovább olvasom',
    collapseLabel: 'Kevesebb',
  },
};

/** Hosszú tartalom - expand gomb megjelenik */
export const LongContent: Story = {
  name: 'Hosszú tartalom',
  args: {
    title: 'Részletes leírás',
    content: LONG_CONTENT,
    collapsedHeight: 100,
  },
};

/** HTML tartalom formázásokkal */
export const WithHtmlContent: Story = {
  name: 'HTML tartalom',
  args: {
    title: 'Szabályok és feltételek',
    content: HTML_CONTENT,
    collapsedHeight: 80,
  },
};

/** Tartalom nélkül - csak cím */
export const NoContent: Story = {
  name: 'Tartalom nélkül',
  args: {
    title: 'Cím tartalom nélkül',
    content: null,
  },
};

/** Egyedi gomb feliratok */
export const CustomLabels: Story = {
  name: 'Egyedi gomb feliratok',
  args: {
    title: 'Hír részletei',
    content: LONG_CONTENT,
    collapsedHeight: 80,
    expandLabel: 'Mutasd az egészet',
    collapseLabel: 'Összecsukás',
  },
};

/** Kis collapsed magasság */
export const SmallCollapsedHeight: Story = {
  name: 'Kis collapsed magasság',
  args: {
    title: 'Kompakt nézet',
    content: LONG_CONTENT,
    collapsedHeight: 50,
  },
};

/** Sötét mód */
export const DarkMode: Story = {
  name: 'Sötét mód',
  args: {
    title: 'Sötét módú bejegyzés',
    content: LONG_CONTENT,
    collapsedHeight: 100,
  },
  decorators: [
    () => ({ styles: [':host { background: #1e293b; }'] }),
  ],
  render: (args) => ({
    props: args,
    template: `
      <div class="dark" style="padding: 20px; color: #e2e8f0;">
        <app-content-block
          [title]="title"
          [content]="content"
          [collapsedHeight]="collapsedHeight"
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
    title: 'Akadálymentes tartalom blokk',
    content: LONG_CONTENT,
    collapsedHeight: 100,
  },
  render: (args) => ({
    props: args,
    template: `
      <div role="region" aria-label="Tartalom blokk">
        <app-content-block
          [title]="title"
          [content]="content"
          [collapsedHeight]="collapsedHeight"
        />
      </div>`,
  }),
};
