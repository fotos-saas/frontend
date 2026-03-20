import { Meta, StoryObj, moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { EmailHubDraftsComponent } from './email-hub-drafts.component';
import { EmailHubService } from '../../services/email-hub.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import type { DraftResponse } from '../../models/email-hub.models';

class MockLoggerService {
  info(..._args: unknown[]): void {}
  warn(..._args: unknown[]): void {}
  error(..._args: unknown[]): void {}
}

class MockToastService {
  success(_title: string, _message: string): void {}
  error(_title: string, _message: string): void {}
  info(_title: string, _message: string): void {}
  warning(_title: string, _message: string): void {}
}

const MOCK_DRAFTS: DraftResponse[] = [
  {
    id: 1,
    responseType: 'auto_reply',
    responseTypeLabel: 'Automatikus valasz',
    status: 'pending',
    statusLabel: 'Jovahagy vasra var',
    draftSubject: 'Re: Tablorendelesi kerdes',
    draftBody: 'Kedves Kovacs Anna! Koszonjuk a megkereseset, a tablo keszitesi hatarideje 2 het...',
    draftBodyHtml: null,
    finalBody: null,
    aiConfidence: 0.92,
    aiModel: 'gpt-4o',
    aiReasoning: null,
    requiresProductionApproval: false,
    productionApproved: null,
    fewShotEmailIds: null,
    approvedAt: null,
    sentAt: null,
    rejectedAt: null,
    createdAt: '2026-03-20T08:30:00.000Z',
    projectEmail: {
      id: 10,
      fromEmail: 'kovacs.anna@gmail.com',
      fromName: 'Kovacs Anna',
      subject: 'Tablorendelesi kerdes',
      bodyPreview: 'Tisztelt Studio! Szeretnem megkerdezni...',
      emailDate: '2026-03-20T07:15:00.000Z',
    },
    project: { id: 5, name: 'Kossuth Lajos Alt. Isk. 8.A' },
  },
  {
    id: 2,
    responseType: 'modification_ack',
    responseTypeLabel: 'Modositasi visszajelzes',
    status: 'pending',
    statusLabel: 'Jovahagy vasra var',
    draftSubject: 'Re: Hattercsere keres',
    draftBody: 'Kedves Nagy Peter! A hattercserest megkezdtuk, elore lathatoan holnap kesz lesz...',
    draftBodyHtml: null,
    finalBody: null,
    aiConfidence: 0.78,
    aiModel: 'gpt-4o',
    aiReasoning: null,
    requiresProductionApproval: true,
    productionApproved: null,
    fewShotEmailIds: [1, 2],
    approvedAt: null,
    sentAt: null,
    rejectedAt: null,
    createdAt: '2026-03-19T14:00:00.000Z',
    projectEmail: {
      id: 11,
      fromEmail: 'nagy.peter@school.hu',
      fromName: 'Nagy Peter',
      subject: 'Hattercsere keres',
      bodyPreview: 'Sziasztok! Lehetseges lenne...',
      emailDate: '2026-03-19T12:30:00.000Z',
    },
    project: { id: 8, name: 'Petofi Sandor Gimn. 12.B' },
  },
];

class MockEmailHubService {
  getDrafts() {
    return of({
      items: MOCK_DRAFTS,
      pagination: { currentPage: 1, lastPage: 1, perPage: 20, total: 2 },
    });
  }
  approveDraft(_id: number) {
    return of({} as DraftResponse);
  }
  rejectDraft(_id: number) {
    return of(void 0);
  }
}

const meta: Meta<EmailHubDraftsComponent> = {
  title: 'Partner/EmailHub/Drafts',
  component: EmailHubDraftsComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient()],
    }),
    moduleMetadata({
      providers: [
        { provide: EmailHubService, useClass: MockEmailHubService },
        { provide: ToastService, useClass: MockToastService },
        { provide: LoggerService, useClass: MockLoggerService },
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<EmailHubDraftsComponent>;

/** Alapertelmezett - Draft lista adatokkal */
export const Default: Story = {};

/** Sotet mod */
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (story) => {
      document.body.classList.add('dark');
      return story();
    },
  ],
};
