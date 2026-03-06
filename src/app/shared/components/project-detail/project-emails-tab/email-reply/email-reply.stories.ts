import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmailReplyComponent } from './email-reply.component';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

const MOCK_EMAIL = {
  id: 1,
  messageId: '<msg-001@example.com>',
  threadId: 'thread-001',
  fromEmail: 'kovacs.anna@iskola.hu',
  fromName: 'Kovács Anna',
  toEmail: 'studio@tablostudio.hu',
  toName: 'TablóStúdió',
  cc: [],
  subject: 'Tabló fotózás',
  bodyPreview: '',
  direction: 'inbound' as const,
  isRead: true,
  needsReply: true,
  isReplied: false,
  hasAttachments: false,
  attachmentCount: 0,
  attachments: [],
  emailDate: new Date().toISOString(),
};

const meta: Meta<EmailReplyComponent> = {
  title: 'Shared/Content/EmailReply',
  component: EmailReplyComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [EmailReplyComponent, FormsModule, LucideAngularModule],
    }),
  ],
  argTypes: {
    sending: { control: 'boolean', description: 'Küldés folyamatban' },
  },
};

export default meta;
type Story = StoryObj<EmailReplyComponent>;

/** Alapértelmezett */
export const Default: Story = {
  args: {
    email: MOCK_EMAIL as any,
    sending: false,
  },
};

/** Küldés folyamatban */
export const KuldesFolyamatban: Story = {
  args: {
    email: MOCK_EMAIL as any,
    sending: true,
  },
};

/** Név nélküli feladó */
export const NevNelkuliFelado: Story = {
  args: {
    email: {
      ...MOCK_EMAIL,
      fromName: null,
    } as any,
    sending: false,
  },
};
