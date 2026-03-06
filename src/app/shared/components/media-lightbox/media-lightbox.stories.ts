import { Meta, StoryObj } from '@storybook/angular';
import { MediaLightboxComponent } from './media-lightbox.component';
import { LightboxMediaItem } from './media-lightbox.types';

/**
 * ## Media Lightbox
 *
 * Teljes képernyős képnézegető overlay.
 *
 * ### Jellemzők:
 * - Teljes képernyős overlay
 * - Zoom: pinch, wheel, dupla kattintás (appZoom direktíva)
 * - Navigáció: nyilak + billentyűzet (bal/jobb nyíl)
 * - Bezárás: ESC, X gomb, overlay kattintás
 * - Thumbnail sáv (ha több kép van)
 * - A11y: Focus trap CDK-val
 * - Zoom vezérlők (+, -, reset)
 */

const mockMedia: LightboxMediaItem[] = [
  {
    id: 1,
    url: 'https://picsum.photos/seed/photo1/1200/800',
    fileName: 'osztaly_foto_01.jpg',
  },
  {
    id: 2,
    url: 'https://picsum.photos/seed/photo2/1200/800',
    fileName: 'osztaly_foto_02.jpg',
  },
  {
    id: 3,
    url: 'https://picsum.photos/seed/photo3/800/1200',
    fileName: 'portre_01.jpg',
  },
  {
    id: 4,
    url: 'https://picsum.photos/seed/photo4/1600/900',
    fileName: 'tablo_terv.jpg',
  },
];

const meta: Meta<MediaLightboxComponent> = {
  title: 'Shared/Dialogs/MediaLightbox',
  component: MediaLightboxComponent,
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
type Story = StoryObj<MediaLightboxComponent>;

/**
 * Alapértelmezett - első kép, több képes galéria
 */
export const Default: Story = {
  args: {
    media: mockMedia,
    currentIndex: 0,
  },
};

/**
 * Egyetlen kép - navigáció nélkül
 */
export const SingleImage: Story = {
  args: {
    media: [mockMedia[0]],
    currentIndex: 0,
  },
  parameters: {
    docs: {
      description: {
        story: 'Egyetlen kép esetén nincsenek navigációs nyilak és thumbnail sáv.',
      },
    },
  },
};

/**
 * Középső kép - mindkét irányba navigálható
 */
export const MiddleImage: Story = {
  args: {
    media: mockMedia,
    currentIndex: 2,
  },
  parameters: {
    docs: {
      description: {
        story: 'Középső kép pozícióban mindkét irányba navigálható.',
      },
    },
  },
};

/**
 * Utolsó kép - csak visszafelé navigálható
 */
export const LastImage: Story = {
  args: {
    media: mockMedia,
    currentIndex: 3,
  },
};
