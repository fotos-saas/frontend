import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { LucideAngularModule, Mail, Edit, RotateCcw, Search, Filter } from 'lucide-angular';
import { EmailTemplateListItem } from '../../../models/email-template.model';

const MOCK_TEMPLATES: EmailTemplateListItem[] = [
  { id: 1, name: 'welcome_email', display_name: 'Regisztráció megerősítése', subject: 'Üdvözlünk!', category: 'auth', is_customized: false, is_system: true, updated_at: '2026-02-15T10:00:00Z' },
  { id: 2, name: 'password_reset', display_name: 'Jelszó visszaállítás', subject: 'Jelszó visszaállítás kérés', category: 'auth', is_customized: true, is_system: true, updated_at: '2026-02-14T14:30:00Z' },
  { id: 3, name: 'order_confirmation', display_name: 'Megrendelés visszaigazolva', subject: 'Megrendelésed visszaigazolása', category: 'order', is_customized: false, is_system: true, updated_at: '2026-02-13T09:00:00Z' },
  { id: 4, name: 'tablo_completed', display_name: 'Tablófotó véglegesítve', subject: 'Gratulálunk!', category: 'tablo', is_customized: true, is_system: true, updated_at: '2026-02-12T16:45:00Z' },
  { id: 5, name: 'work_session_access_code', display_name: 'Belépési kód', subject: 'Belépési kódod', category: 'session', is_customized: false, is_system: true, updated_at: '2026-02-11T11:20:00Z' },
];

const meta: Meta = {
  title: 'Partner/EmailTemplateList',
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ Mail, Edit, RotateCcw, Search, Filter })],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj;

/** Default - Email sablon lista */
export const Default: Story = {
  render: () => ({
    props: {
      templates: signal(MOCK_TEMPLATES),
      loading: signal(false),
      search: signal(''),
      activeCategory: signal('all'),
      customizedCount: 2,
    },
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <lucide-icon name="mail" [size]="24" style="color: #6366f1;"></lucide-icon>
          <h1 style="margin: 0; font-size: 1.5rem;">Email sablonok</h1>
          <span style="background: #e0e7ff; color: #4338ca; padding: 2px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
            {{ customizedCount }} testreszabott
          </span>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          @for (cat of ['all', 'auth', 'session', 'order', 'tablo', 'general']; track cat) {
            <button
              (click)="activeCategory.set(cat)"
              [style.background]="activeCategory() === cat ? '#6366f1' : '#f1f5f9'"
              [style.color]="activeCategory() === cat ? '#fff' : '#475569'"
              style="border: none; padding: 6px 16px; border-radius: 20px; cursor: pointer; font-size: 0.875rem; font-weight: 500;">
              {{ cat === 'all' ? 'Mind' : cat }}
            </button>
          }
        </div>

        @for (t of templates(); track t.id) {
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s;"
               onmouseenter="this.style.borderColor='#6366f1'; this.style.transform='translateY(-1px)'"
               onmouseleave="this.style.borderColor='#e2e8f0'; this.style.transform='none'">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 600; color: #1e293b;">{{ t.display_name }}</span>
                @if (t.is_customized) {
                  <span style="background: #dbeafe; color: #2563eb; padding: 1px 8px; border-radius: 8px; font-size: 0.7rem; font-weight: 600;">Testreszabott</span>
                }
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px;">{{ t.subject }}</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button style="border: none; background: #f1f5f9; padding: 8px; border-radius: 8px; cursor: pointer;">
                <lucide-icon name="edit" [size]="16" style="color: #6366f1;"></lucide-icon>
              </button>
            </div>
          </div>
        }
      </div>
    `,
  }),
};

/** Loading - Betöltés alatt */
export const Loading: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <lucide-icon name="mail" [size]="24" style="color: #6366f1;"></lucide-icon>
          <h1 style="margin: 0; font-size: 1.5rem;">Email sablonok</h1>
        </div>
        @for (i of [1, 2, 3, 4]; track i) {
          <div style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px;">
            <div style="height: 16px; width: 200px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); border-radius: 4px; animation: shimmer 1.5s infinite;"></div>
            <div style="height: 12px; width: 300px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); border-radius: 4px; margin-top: 8px;"></div>
          </div>
        }
      </div>
    `,
  }),
};

/** DarkMode - Sötét háttéren */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    props: {
      templates: signal(MOCK_TEMPLATES.slice(0, 3)),
    },
    template: `
      <div style="padding: 20px; background: #1e293b; border-radius: 12px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <lucide-icon name="mail" [size]="24" style="color: #818cf8;"></lucide-icon>
          <h1 style="margin: 0; font-size: 1.5rem; color: #f1f5f9;">Email sablonok</h1>
        </div>
        @for (t of templates(); track t.id) {
          <div style="padding: 16px; border: 1px solid #334155; border-radius: 12px; margin-bottom: 8px; background: #0f172a;">
            <span style="font-weight: 600; color: #f1f5f9;">{{ t.display_name }}</span>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">{{ t.subject }}</div>
          </div>
        }
      </div>
    `,
  }),
};
