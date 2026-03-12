import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { PostContentComponent } from './post-content.component';

/**
 * ## Post Content
 *
 * HTML tartalom biztonsagos megjelenitese SafeHtml pipe-pal.
 *
 * ### Jellemzok:
 * - XSS vedelem (DOMPurify)
 * - Rich text tamogatas (p, ul, ol, a, code, blockquote)
 * - Normal es small font meret
 * - prefers-reduced-motion tamogatas
 */
const meta: Meta<PostContentComponent> = {
  title: 'Shared/PostContent',
  component: PostContentComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostContentComponent],
    }),
  ],
  argTypes: {
    content: {
      control: 'text',
      description: 'HTML tartalom (SafeHtml pipe-on at)',
    },
    fontSize: {
      control: 'select',
      options: ['normal', 'small'],
      description: 'Font meret (normal / small)',
    },
  },
};

export default meta;
type Story = StoryObj<PostContentComponent>;

// ============================================================================
// ALAP VARIANSOK
// ============================================================================

/** Alapertelmezett - egyszeru szoveg */
export const Default: Story = {
  args: {
    content: '<p>Ez egy egyszeru forum hozzaszolas tartalma, amely normal meretben jelenik meg.</p>',
    fontSize: 'normal',
  },
};

/** Kis betumeret (valasz kommentekhez) */
export const SmallFontSize: Story = {
  args: {
    content: '<p>Ez kisebb betumeretben jelenik meg, tipikusan valasz kommentekhaz.</p>',
    fontSize: 'small',
  },
};

/** Rich text tartalom (vegyes HTML elemek) */
export const RichText: Story = {
  args: {
    content: `
      <p>Ez egy <strong>formázott</strong> bejegyzes, amelyben <em>kulonbozo</em> HTML elemek vannak.</p>
      <ul>
        <li>Elso listaelem</li>
        <li>Masodik listaelem</li>
        <li>Harmadik listaelem</li>
      </ul>
      <p>Egy <a href="https://example.com">link peldaja</a> a szovegben.</p>
      <blockquote>Ez egy idezet blokk, ami vizuálisan elkülönül a szövegtől.</blockquote>
      <p>Es vegul egy <code>inline kod</code> peldaja.</p>
    `,
    fontSize: 'normal',
  },
};

/** Szamozott lista */
export const OrderedList: Story = {
  args: {
    content: `
      <p>Kovetendo lepesek:</p>
      <ol>
        <li>Valaszd ki a kepeket</li>
        <li>Toltsd fel az albumba</li>
        <li>Veglegesitsd a tablot</li>
      </ol>
    `,
    fontSize: 'normal',
  },
};

/** Csak linkek */
export const WithLinks: Story = {
  args: {
    content: `
      <p>Hasznos hivatkozasok:</p>
      <p><a href="https://tablostudio.hu">TabloStudio fooldal</a></p>
      <p><a href="https://kepvalaszto.hu">Kepvalaszto alkalmazas</a></p>
    `,
    fontSize: 'normal',
  },
};

/** Hosszu tartalom */
export const LongContent: Story = {
  args: {
    content: `
      <p>Ez egy hosszabb hozzaszolas, amely tobb bekezdesbol all. Az elso bekezdes bevezeti a temat, a masodik reszletesen kifejti, a harmadik pedig osszefoglalja.</p>
      <p>A masodik bekezdesben reszletesebben kifejtem a velemenyet. Fontos, hogy a szoveg jol tordelheto legyen, es a sorok kozotti tavolsag (line-height) is megfelelo maradjon hosszabb szoveg eseten.</p>
      <blockquote>Idezet egy korabbi hozzaszolasbol, ami kontextust ad a valaszhoz.</blockquote>
      <p>Vegezetul osszefoglalva: a komponens jol kezeli a hosszabb tartalmakat is, a word-break: break-word biztositja, hogy a tuszszu szavak se lognak ki.</p>
    `,
    fontSize: 'normal',
  },
};

/** Ures tartalom */
export const EmptyContent: Story = {
  args: {
    content: '',
    fontSize: 'normal',
  },
};

// ============================================================================
// DARK MODE & A11Y
// ============================================================================

/** Sotet mod */
export const DarkMode: Story = {
  args: {
    content: `
      <p>Sotet modban is olvashato kell legyen a <strong>formázott</strong> tartalom.</p>
      <p>Egy <a href="https://example.com">link</a> es <code>kod</code> pelda.</p>
      <blockquote>Idezet blokk sotet modban.</blockquote>
    `,
    fontSize: 'normal',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => ({
      template: `<div class="dark" style="padding: 20px; background: #1e293b; color: #e2e8f0;"><app-post-content [content]="content" [fontSize]="fontSize" /></div>`,
      props: story().props,
    }),
  ],
};

/** Akadalymentessegi variacio */
export const A11y: Story = {
  args: {
    content: `
      <p>Ez a tartalom <strong>ARIA region</strong>-ba van csomagolva a kepernyoolvasok szamara.</p>
      <ul>
        <li>Strukturalt HTML tartalom</li>
        <li>Szemantikus elemek</li>
      </ul>
    `,
    fontSize: 'normal',
  },
  decorators: [
    (story) => ({
      template: `<div role="region" aria-label="Bejegyzes tartalma"><app-post-content [content]="content" [fontSize]="fontSize" /></div>`,
      props: story().props,
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: 'A tartalom ARIA region-ba csomagolva. A SafeHtml pipe DOMPurify-val biztositja az XSS vedelmet, mig a szemantikus HTML elemek megmaradnak.',
      },
    },
  },
};
