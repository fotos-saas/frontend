import { Meta, StoryObj } from '@storybook/angular';
import { SamplesLightboxComponent } from './samples-lightbox.component';
import { SampleLightboxItem } from './samples-lightbox.types';

/**
 * ## Samples Lightbox
 *
 * Mintaképek lightbox megjelenítése.
 *
 * ### Jellemzők:
 * - Zoom: pinch, wheel, gombok, long press
 * - Navigáció: nyíl gombok, billentyűzet
 * - Leírás panel (opcionális, ha van description)
 * - Meta bar: dátum, zoom controls, számláló
 * - Backdrop handler (kijelölés közbeni bezárás megelőzése)
 *
 * ### Használat:
 * - SamplesComponent (mintaképek oldal)
 * - SamplesModalComponent (partner)
 */

const mockSamples: SampleLightboxItem[] = [
  {
    id: 1,
    url: 'https://picsum.photos/seed/sample1/1200/800',
    thumbUrl: 'https://picsum.photos/seed/sample1/200/133',
    fileName: 'minta_tablo_01.jpg',
    createdAt: '2024-06-15T10:30:00Z',
    description: '<p>Klasszikus tabló minta - kék háttér, arany keret.</p>',
  },
  {
    id: 2,
    url: 'https://picsum.photos/seed/sample2/1200/800',
    thumbUrl: 'https://picsum.photos/seed/sample2/200/133',
    fileName: 'minta_tablo_02.jpg',
    createdAt: '2024-06-16T14:00:00Z',
    description: '<p>Modern tabló minta - szürke háttér, minimalista stílus.</p>',
  },
  {
    id: 3,
    url: 'https://picsum.photos/seed/sample3/1200/800',
    thumbUrl: 'https://picsum.photos/seed/sample3/200/133',
    fileName: 'minta_tablo_03.jpg',
    createdAt: '2024-06-17T09:15:00Z',
  },
  {
    id: 4,
    url: 'https://picsum.photos/seed/sample4/800/1200',
    thumbUrl: 'https://picsum.photos/seed/sample4/133/200',
    fileName: 'portre_minta.jpg',
    createdAt: '2024-06-18T16:45:00Z',
    description: '<p>Portré minta - <strong>álló formátum</strong>, fehér háttér.</p>',
  },
];

const meta: Meta<SamplesLightboxComponent> = {
  title: 'Shared/Dialogs/SamplesLightbox',
  component: SamplesLightboxComponent,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#000000' },
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<SamplesLightboxComponent>;

/**
 * Alapértelmezett - első minta, leírással
 */
export const Default: Story = {
  args: {
    samples: mockSamples,
    currentIndex: 0,
  },
};

/**
 * Leírás nélküli minta
 */
export const WithoutDescription: Story = {
  args: {
    samples: mockSamples,
    currentIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'A harmadik mintának nincs leírása, ezért a leírás panel nem jelenik meg.',
      },
    },
  },
};

/**
 * Egyetlen minta - navigáció nélkül
 */
export const SingleSample: Story = {
  args: {
    samples: [mockSamples[0]],
    currentIndex: 0,
  },
};

/**
 * Álló formátumú kép
 */
export const PortraitImage: Story = {
  args: {
    samples: mockSamples,
    currentIndex: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Álló formátumú kép megjelenítése a lightboxban.',
      },
    },
  },
};
