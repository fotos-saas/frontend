import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostAvatarComponent } from './post-avatar.component';

const meta: Meta<PostAvatarComponent> = {
  title: 'Shared/Content/PostAvatar',
  component: PostAvatarComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostAvatarComponent],
    }),
  ],
  argTypes: {
    authorName: { control: 'text', description: 'Szerző neve' },
    size: {
      control: 'select',
      options: ['tiny', 'small', 'medium'],
      description: 'Méret',
    },
  },
};

export default meta;
type Story = StoryObj<PostAvatarComponent>;

/** Alapértelmezett - közepes méret */
export const Default: Story = {
  args: {
    authorName: 'Kovács Anna',
    size: 'medium',
  },
};

/** Kis méret */
export const KisMeret: Story = {
  args: {
    authorName: 'Nagy Péter',
    size: 'small',
  },
};

/** Apró méret */
export const AproMeret: Story = {
  args: {
    authorName: 'Tóth Gábor',
    size: 'tiny',
  },
};

/** Minden méret egymás mellett */
export const OsszesMeret: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 16px;">
        <app-post-avatar authorName="Kiss Anna" size="tiny" />
        <app-post-avatar authorName="Kiss Anna" size="small" />
        <app-post-avatar authorName="Kiss Anna" size="medium" />
      </div>
    `,
  }),
};

/** Különböző nevek - kezdőbetűk */
export const KulonbozoNevek: Story = {
  render: () => ({
    template: `
      <div style="display: flex; align-items: center; gap: 12px;">
        <app-post-avatar authorName="Anna" size="medium" />
        <app-post-avatar authorName="Béla" size="medium" />
        <app-post-avatar authorName="Csaba" size="medium" />
        <app-post-avatar authorName="Éva" size="medium" />
        <app-post-avatar authorName="Zsófia" size="medium" />
      </div>
    `,
  }),
};
