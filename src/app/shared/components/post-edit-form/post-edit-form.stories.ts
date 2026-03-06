import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostEditFormComponent } from './post-edit-form.component';
import { FormsModule } from '@angular/forms';

const meta: Meta<PostEditFormComponent> = {
  title: 'Shared/Content/PostEditForm',
  component: PostEditFormComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostEditFormComponent, FormsModule],
    }),
  ],
  argTypes: {
    initialContent: { control: 'text', description: 'Kezdeti tartalom' },
    allowMedia: { control: 'boolean', description: 'Média szerkesztés engedélyezve' },
    remainingTime: { control: 'text', description: 'Hátralévő idő' },
    isSubmitting: { control: 'boolean', description: 'Küldés folyamatban' },
    rows: { control: 'number', description: 'Textarea sorok száma' },
  },
};

export default meta;
type Story = StoryObj<PostEditFormComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    initialContent: 'Ez a szerkesztendő tartalom.',
    allowMedia: true,
    isSubmitting: false,
    rows: 4,
  },
};

/** Hátralévő idővel */
export const HatralevoidoVel: Story = {
  args: {
    initialContent: 'Ezt a hozzászólást még szerkeszthetem.',
    allowMedia: true,
    remainingTime: '5 perc',
    isSubmitting: false,
    rows: 4,
  },
};

/** Küldés folyamatban */
export const Kuldes: Story = {
  args: {
    initialContent: 'Mentés alatt álló tartalom.',
    allowMedia: false,
    isSubmitting: true,
    rows: 4,
  },
};

/** Meglévő médiával */
export const MeglevoMediaval: Story = {
  args: {
    initialContent: 'Tartalom csatolmányokkal.',
    existingMedia: [
      { id: 1, url: 'https://picsum.photos/seed/e1/100/100', fileName: 'foto_01.jpg', isImage: true },
      { id: 2, url: 'https://picsum.photos/seed/e2/100/100', fileName: 'foto_02.jpg', isImage: true },
    ],
    allowMedia: true,
    isSubmitting: false,
    rows: 4,
  },
};

/** Média nélkül */
export const MediaNelkul: Story = {
  args: {
    initialContent: 'Szöveges szerkesztés, média nélkül.',
    allowMedia: false,
    isSubmitting: false,
    rows: 6,
  },
};
