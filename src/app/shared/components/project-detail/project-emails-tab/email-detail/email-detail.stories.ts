import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { EmailDetailComponent } from './email-detail.component';
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
  subject: 'Tabló fotózás időpont egyeztetés',
  bodyPreview: 'Tisztelt Stúdió! Szeretném egyeztetni a fotózás időpontját...',
  bodyHtml: '<p>Tisztelt Stúdió!</p><p>Szeretném egyeztetni a fotózás időpontját a következő hétre. A diákok többsége szerdán vagy csütörtökön ér rá.</p><p>Üdvözlettel,<br>Kovács Anna<br>Osztályfőnök</p>',
  bodyText: 'Tisztelt Stúdió! Szeretném egyeztetni...',
  direction: 'inbound' as const,
  isRead: true,
  needsReply: true,
  isReplied: false,
  hasAttachments: true,
  attachmentCount: 2,
  attachments: [
    { name: 'nevsor.xlsx', mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 15360 },
    { name: 'osztálykép.jpg', mime_type: 'image/jpeg', size: 2457600 },
  ],
  emailDate: new Date(Date.now() - 86400000).toISOString(),
};

const meta: Meta<EmailDetailComponent> = {
  title: 'Shared/Content/EmailDetail',
  component: EmailDetailComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [EmailDetailComponent, LucideAngularModule],
    }),
  ],
  argTypes: {
    loading: { control: 'boolean', description: 'Betöltés állapot' },
  },
};

export default meta;
type Story = StoryObj<EmailDetailComponent>;

/** Alapértelmezett - bejövő email */
export const Default: Story = {
  args: {
    email: MOCK_EMAIL as any,
    thread: [],
    loading: false,
  },
};

/** Betöltés állapot */
export const Betoltes: Story = {
  args: {
    email: MOCK_EMAIL as any,
    thread: [],
    loading: true,
  },
};

/** Válaszra váró email */
export const ValaszraVaro: Story = {
  args: {
    email: {
      ...MOCK_EMAIL,
      needsReply: true,
      isReplied: false,
    } as any,
    thread: [],
    loading: false,
  },
};

/** Kimenő email */
export const KimenoEmail: Story = {
  args: {
    email: {
      ...MOCK_EMAIL,
      direction: 'outbound' as const,
      fromEmail: 'studio@tablostudio.hu',
      fromName: 'TablóStúdió',
      toEmail: 'kovacs.anna@iskola.hu',
      toName: 'Kovács Anna',
      subject: 'Re: Tabló fotózás időpont egyeztetés',
      bodyHtml: '<p>Kedves Kovács Anna!</p><p>Szerda délelőttre tudnánk ütemezni a fotózást. Jó lenne ez?</p><p>Üdvözlettel,<br>TablóStúdió</p>',
      needsReply: false,
      hasAttachments: false,
      attachmentCount: 0,
      attachments: [],
    } as any,
    thread: [],
    loading: false,
  },
};

/** Csatolmány nélkül */
export const CsatolmanyNelkul: Story = {
  args: {
    email: {
      ...MOCK_EMAIL,
      hasAttachments: false,
      attachmentCount: 0,
      attachments: [],
    } as any,
    thread: [],
    loading: false,
  },
};
