import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmailListItemComponent } from './email-list-item.component';
import { LucideAngularModule } from 'lucide-angular';

const BASE_EMAIL = {
  id: 1,
  messageId: '<msg-001@example.com>',
  threadId: 'thread-001',
  fromEmail: 'kovacs.anna@iskola.hu',
  fromName: 'Kovács Anna',
  toEmail: 'studio@tablostudio.hu',
  toName: 'TablóStúdió',
  cc: [],
  subject: 'Tabló fotózás időpont egyeztetés',
  bodyPreview: 'Tisztelt Stúdió! Szeretném egyeztetni a fotózás időpontját a következő hétre.',
  direction: 'inbound' as const,
  isRead: false,
  needsReply: true,
  isReplied: false,
  hasAttachments: true,
  attachmentCount: 1,
  attachments: [{ name: 'nevsor.xlsx', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }],
  emailDate: new Date(Date.now() - 3600000).toISOString(),
};

const meta: Meta<EmailListItemComponent> = {
  title: 'Shared/Content/EmailListItem',
  component: EmailListItemComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [EmailListItemComponent, LucideAngularModule],
    }),
  ],
  argTypes: {
    isSelected: { control: 'boolean', description: 'Kijelölt' },
  },
};

export default meta;
type Story = StoryObj<EmailListItemComponent>;

/** Alapértelmezett - olvasatlan bejövő */
export const Default: Story = {
  args: {
    email: BASE_EMAIL as any,
    isSelected: false,
  },
};

/** Olvasott */
export const Olvasott: Story = {
  args: {
    email: { ...BASE_EMAIL, isRead: true, needsReply: false } as any,
    isSelected: false,
  },
};

/** Kijelölt */
export const Kijelolt: Story = {
  args: {
    email: BASE_EMAIL as any,
    isSelected: true,
  },
};

/** Kimenő email */
export const KimenoEmail: Story = {
  args: {
    email: {
      ...BASE_EMAIL,
      direction: 'outbound' as const,
      fromEmail: 'studio@tablostudio.hu',
      fromName: 'TablóStúdió',
      toEmail: 'kovacs.anna@iskola.hu',
      toName: 'Kovács Anna',
      subject: 'Re: Fotózás',
      isRead: true,
      needsReply: false,
      hasAttachments: false,
    } as any,
    isSelected: false,
  },
};

/** Válaszra váró */
export const ValaszraVaro: Story = {
  args: {
    email: {
      ...BASE_EMAIL,
      needsReply: true,
      isReplied: false,
    } as any,
    isSelected: false,
  },
};

/** Csatolmány nélkül */
export const CsatolmanyNelkul: Story = {
  args: {
    email: {
      ...BASE_EMAIL,
      hasAttachments: false,
      attachmentCount: 0,
      attachments: [],
      isRead: true,
      needsReply: false,
    } as any,
    isSelected: false,
  },
};

/** Email lista (több elem) */
export const EmailLista: Story = {
  render: () => ({
    template: `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <app-email-list-item [email]="email1" [isSelected]="false" />
        <app-email-list-item [email]="email2" [isSelected]="true" />
        <app-email-list-item [email]="email3" [isSelected]="false" />
      </div>
    `,
    props: {
      email1: { ...BASE_EMAIL, id: 1 },
      email2: { ...BASE_EMAIL, id: 2, isRead: true, subject: 'Re: Fotózás', needsReply: false },
      email3: {
        ...BASE_EMAIL,
        id: 3,
        direction: 'outbound',
        fromEmail: 'studio@tablostudio.hu',
        fromName: 'TablóStúdió',
        isRead: true,
        needsReply: false,
        hasAttachments: false,
        subject: 'Válasz: Időpont',
      },
    },
  }),
};
