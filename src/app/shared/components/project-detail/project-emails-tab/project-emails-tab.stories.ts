import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { LUCIDE_ICONS_MAP } from '../../../constants/lucide-icons';
import { EmailListItemComponent } from './email-list-item/email-list-item.component';
import type { ProjectEmail } from '../../../../features/partner/models/project-email.models';

const mockEmail: ProjectEmail = {
  id: 1,
  messageId: '<abc123@example.com>',
  threadId: null,
  fromEmail: 'szulo@example.com',
  fromName: 'Kovács Péter',
  toEmail: 'studio@tablostudio.hu',
  toName: 'Tabló Stúdió',
  cc: [],
  subject: 'Tablóképek határidő kérdés',
  bodyPreview: 'Szia! Szeretném megkérdezni, hogy mikor lesz kész a tablókép...',
  direction: 'inbound',
  isRead: false,
  needsReply: true,
  isReplied: false,
  hasAttachments: false,
  attachmentCount: 0,
  attachments: [],
  emailDate: '2026-02-24T10:30:00Z',
};

const mockEmailRead: ProjectEmail = {
  ...mockEmail,
  id: 2,
  isRead: true,
  needsReply: false,
  isReplied: true,
  fromEmail: 'masik@example.com',
  fromName: 'Nagy Anna',
  subject: 'Re: Fotók kiválasztása',
  bodyPreview: 'Köszönöm a tájékoztatást, már kiválasztottam a képeket.',
};

const mockEmailOutbound: ProjectEmail = {
  ...mockEmail,
  id: 3,
  direction: 'outbound',
  isRead: true,
  needsReply: false,
  fromEmail: 'studio@tablostudio.hu',
  fromName: 'Tabló Stúdió',
  toEmail: 'szulo@example.com',
  toName: 'Kovács Péter',
  subject: 'Re: Tablóképek határidő kérdés',
  bodyPreview: 'Kedves Péter! A tablókép 2 héten belül elkészül...',
};

const mockEmailWithAttachment: ProjectEmail = {
  ...mockEmail,
  id: 4,
  fromName: 'Kiss Éva',
  fromEmail: 'eva@example.com',
  subject: 'Megrendelés - PDF melléklettel',
  bodyPreview: 'Mellékelem a kitöltött megrendelőlapot.',
  hasAttachments: true,
  attachmentCount: 2,
  attachments: [
    { filename: 'megrendeles.pdf', mime_type: 'application/pdf', size: 245000 },
    { filename: 'foto.jpg', mime_type: 'image/jpeg', size: 1200000 },
  ],
};

const meta: Meta<EmailListItemComponent> = {
  title: 'Project Detail/Email List Item',
  component: EmailListItemComponent,
  decorators: [
    moduleMetadata({
      providers: [
        provideHttpClient(),
        importProvidersFrom(LucideAngularModule.pick(LUCIDE_ICONS_MAP)),
      ],
    }),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<EmailListItemComponent>;

export const Default: Story = {
  args: {
    email: mockEmail as any,
    isSelected: false as any,
  },
};

export const Selected: Story = {
  args: {
    email: mockEmail as any,
    isSelected: true as any,
  },
};

export const ReadEmail: Story = {
  args: {
    email: mockEmailRead as any,
    isSelected: false as any,
  },
};

export const OutboundEmail: Story = {
  args: {
    email: mockEmailOutbound as any,
    isSelected: false as any,
  },
};

export const WithAttachment: Story = {
  args: {
    email: mockEmailWithAttachment as any,
    isSelected: false as any,
  },
};
