import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { NgClass } from '@angular/common';
import {
  LucideAngularModule,
  Circle, Camera, AlertTriangle, Mail, MailCheck,
  Forward, Phone, Clock, ArrowRight, FileCheck,
  UserCheck, Printer, Check, ChevronDown,
} from 'lucide-angular';
import { StatusDropdownComponent } from './status-dropdown.component';

const meta: Meta<StatusDropdownComponent> = {
  title: 'Shared/UI/StatusDropdown',
  component: StatusDropdownComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [
        StatusDropdownComponent,
        NgClass,
        LucideAngularModule.pick({
          Circle, Camera, AlertTriangle, Mail, MailCheck,
          Forward, Phone, Clock, ArrowRight, FileCheck,
          UserCheck, Printer, Check, ChevronDown,
        }),
      ],
    }),
  ],
  argTypes: {
    currentStatus: {
      control: 'select',
      options: [
        'not_started', 'waiting_for_photos', 'sos_waiting_for_photos',
        'waiting_for_response', 'got_response', 'needs_forwarding',
        'needs_call', 'should_finish', 'push_could_be_done',
        'waiting_for_finalization', 'at_teacher_for_finalization',
        'in_print', 'done',
      ],
      description: 'Aktuális státusz',
    },
    currentLabel: {
      control: 'text',
      description: 'Aktuális címke',
    },
    currentColor: {
      control: 'select',
      options: ['gray', 'red', 'blue', 'green', 'amber', 'purple'],
      description: 'Aktuális szín',
    },
    shortLabels: {
      control: 'boolean',
      description: 'Rövid feliratok',
    },
  },
};

export default meta;
type Story = StoryObj<StatusDropdownComponent>;

/** Alapértelmezett - nem elkezdett */
export const Default: Story = {
  args: {
    currentStatus: 'not_started',
    currentLabel: 'Nincs elkezdve',
    currentColor: 'gray',
    shortLabels: false,
  },
};

/** Képekre várok */
export const WaitingForPhotos: Story = {
  args: {
    currentStatus: 'waiting_for_photos',
    currentLabel: 'Képekre várok',
    currentColor: 'red',
    shortLabels: false,
  },
};

/** Kész */
export const Done: Story = {
  args: {
    currentStatus: 'done',
    currentLabel: 'Kész',
    currentColor: 'green',
    shortLabels: false,
  },
};

/** Nyomdában */
export const InPrint: Story = {
  args: {
    currentStatus: 'in_print',
    currentLabel: 'Nyomdában',
    currentColor: 'purple',
    shortLabels: false,
  },
};

/** Rövid feliratok */
export const ShortLabels: Story = {
  args: {
    currentStatus: 'waiting_for_response',
    currentLabel: 'Válaszra várok',
    currentColor: 'blue',
    shortLabels: true,
  },
};

/** Sötét háttér */
export const DarkMode: Story = {
  args: {
    currentStatus: 'not_started',
    currentLabel: 'Nincs elkezdve',
    currentColor: 'gray',
    shortLabels: false,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
