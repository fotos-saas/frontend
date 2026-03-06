import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { InfoHelpItemComponent } from './info-help-item.component';
import { LucideAngularModule } from 'lucide-angular';

const meta: Meta<InfoHelpItemComponent> = {
  title: 'Shared/Content/InfoHelpItem',
  component: InfoHelpItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [InfoHelpItemComponent, LucideAngularModule],
    }),
  ],
  argTypes: {
    icon: { control: 'text', description: 'Ikon neve' },
    title: { control: 'text', description: 'Cím' },
    color: {
      control: 'select',
      options: ['purple', 'indigo', 'teal', 'emerald', 'blue', 'amber', 'red'],
      description: 'Szín téma',
    },
  },
};

export default meta;
type Story = StoryObj<InfoHelpItemComponent>;

/** Alapértelmezett - kék */
export const Default: Story = {
  args: {
    icon: 'info',
    title: 'Hasznos információ',
    color: 'blue',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-info-help-item [icon]="icon" [title]="title" [color]="color">
        Ez egy hasznos tipp a felhasználónak a funkció használatáról.
      </app-info-help-item>
    `,
  }),
};

/** Lila - funkció leírás */
export const Lila: Story = {
  args: {
    icon: 'sparkles',
    title: 'Új funkció',
    color: 'purple',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-info-help-item [icon]="icon" [title]="title" [color]="color">
        Mostantól lehetőség van a képek közvetlen szerkesztésére!
      </app-info-help-item>
    `,
  }),
};

/** Zöld - siker */
export const Zold: Story = {
  args: {
    icon: 'check-circle',
    title: 'Sikeres művelet',
    color: 'emerald',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-info-help-item [icon]="icon" [title]="title" [color]="color">
        A képek sikeresen feltöltődtek a galériába.
      </app-info-help-item>
    `,
  }),
};

/** Sárga - figyelmeztetés */
export const Sarga: Story = {
  args: {
    icon: 'alert-triangle',
    title: 'Figyelem',
    color: 'amber',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-info-help-item [icon]="icon" [title]="title" [color]="color">
        A képválasztás határideje 3 napon belül lejár!
      </app-info-help-item>
    `,
  }),
};

/** Piros - hiba */
export const Piros: Story = {
  args: {
    icon: 'alert-circle',
    title: 'Hiba történt',
    color: 'red',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-info-help-item [icon]="icon" [title]="title" [color]="color">
        A fájl feltöltése sikertelen. Kérjük, próbáld újra!
      </app-info-help-item>
    `,
  }),
};

/** Minden szín */
export const MindenSzin: Story = {
  render: () => ({
    template: `
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 500px;">
        <app-info-help-item icon="info" title="Kék" color="blue">Információs üzenet</app-info-help-item>
        <app-info-help-item icon="sparkles" title="Lila" color="purple">Új funkció</app-info-help-item>
        <app-info-help-item icon="globe" title="Indigo" color="indigo">Kapcsolódó tartalom</app-info-help-item>
        <app-info-help-item icon="leaf" title="Teal" color="teal">Környezeti adat</app-info-help-item>
        <app-info-help-item icon="check" title="Zöld" color="emerald">Siker</app-info-help-item>
        <app-info-help-item icon="alert-triangle" title="Sárga" color="amber">Figyelmeztetés</app-info-help-item>
        <app-info-help-item icon="x-circle" title="Piros" color="red">Hiba</app-info-help-item>
      </div>
    `,
  }),
};
