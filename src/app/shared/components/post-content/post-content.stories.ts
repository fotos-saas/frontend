import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { PostContentComponent } from './post-content.component';

const meta: Meta<PostContentComponent> = {
  title: 'Shared/Content/PostContent',
  component: PostContentComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [PostContentComponent],
    }),
  ],
  argTypes: {
    content: { control: 'text', description: 'HTML tartalom' },
    fontSize: {
      control: 'select',
      options: ['small', 'normal'],
      description: 'Betűméret',
    },
  },
};

export default meta;
type Story = StoryObj<PostContentComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    content: '<p>Ez egy egyszerű szöveges tartalom a posztban.</p>',
    fontSize: 'normal',
  },
};

/** Kis betűméret */
export const KisBetumeret: Story = {
  args: {
    content: '<p>Ez kisebb betűmérettel jelenik meg, pl. válaszoknál.</p>',
    fontSize: 'small',
  },
};

/** Formázott tartalom */
export const FormazottTartalom: Story = {
  args: {
    content: `
      <p><strong>Fontos bejelentés!</strong></p>
      <p>A tabló <em>fotózás</em> időpontja: <a href="#">2026. március 15.</a></p>
      <ul>
        <li>Kérjük hozzátok a díjat</li>
        <li>Egyeztetett öltözék: fehér felső</li>
      </ul>
      <blockquote>Megjegyzés: Az időpont végleges.</blockquote>
      <p>Kód példa: <code>npm install</code></p>
    `,
    fontSize: 'normal',
  },
};

/** Hosszú szöveg */
export const HosszuSzoveg: Story = {
  args: {
    content: `
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    `,
    fontSize: 'normal',
  },
};
