import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { LucideAngularModule, ScrollText, ChevronLeft, ChevronRight, Search, X } from 'lucide-angular';
import { ActivityLogItem } from '../../services/partner-activity.service';

const MOCK_ITEMS: ActivityLogItem[] = [
  {
    id: 1, log_name: 'project', description: 'updated', event: 'updated',
    subject_type: 'TabloProject', subject_id: 42, subject_name: 'Kossuth Lajos Ált. Isk. 8.a',
    causer: { id: 5, name: 'Kiss Péter' },
    changes: { old: { status: 'draft' }, attributes: { status: 'active' } },
    project: { id: 42, name: 'Kossuth Lajos Ált. Isk. 8.a' },
    created_at: '2026-02-26T10:30:00.000Z',
  },
  {
    id: 2, log_name: 'photo', description: 'created', event: 'created',
    subject_type: 'Photo', subject_id: 101, subject_name: 'IMG_2024.jpg',
    causer: { id: 5, name: 'Kiss Péter' },
    changes: null, project: null,
    created_at: '2026-02-26T09:15:00.000Z',
  },
  {
    id: 3, log_name: 'album', description: 'deleted', event: 'deleted',
    subject_type: 'PartnerAlbum', subject_id: 8, subject_name: 'Osztálykép album',
    causer: { id: 12, name: 'Nagy Eszter' },
    changes: null, project: null,
    created_at: '2026-02-25T18:00:00.000Z',
  },
  {
    id: 4, log_name: 'billing', description: 'Előfizetés lemondás', event: null,
    subject_type: null, subject_id: null, subject_name: null,
    causer: { id: 5, name: 'Kiss Péter' },
    changes: null, project: null,
    created_at: '2026-02-25T14:22:00.000Z',
  },
  {
    id: 5, log_name: 'export', description: 'Excel export', event: null,
    subject_type: 'TabloProject', subject_id: 42, subject_name: 'Kossuth Lajos 8.a',
    causer: null, changes: null, project: null,
    created_at: '2026-02-24T11:00:00.000Z',
  },
];

function getEventClass(event: string | null): string {
  const map: Record<string, string> = { created: 'badge-green', updated: 'badge-blue', deleted: 'badge-red' };
  return map[event ?? ''] ?? 'badge-gray';
}

function getCategoryLabel(logName: string): string {
  const map: Record<string, string> = {
    partner: 'Partner', project: 'Projekt', photo: 'Fotó', album: 'Album',
    tablo: 'Tabló', billing: 'Számlázás', order: 'Rendelés', export: 'Export', email: 'E-mail',
  };
  return map[logName] ?? logName;
}

function getEventLabel(event: string | null): string {
  if (!event) return '';
  const map: Record<string, string> = { created: 'Létrehozva', updated: 'Módosítva', deleted: 'Törölve' };
  return map[event] ?? event;
}

const meta: Meta = {
  title: 'Partner/ActivityLog',
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ ScrollText, ChevronLeft, ChevronRight, Search, X })],
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

const BADGE_STYLES: Record<string, string> = {
  'badge-green': 'background: #dcfce7; color: #166534;',
  'badge-blue': 'background: #dbeafe; color: #1e40af;',
  'badge-red': 'background: #fee2e2; color: #991b1b;',
  'badge-gray': 'background: #f1f5f9; color: #475569;',
};

function renderRow(item: ActivityLogItem): string {
  const date = new Date(item.created_at);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const cls = getEventClass(item.event);
  const badgeStyle = BADGE_STYLES[cls] || BADGE_STYLES['badge-gray'];
  const eventText = item.event ? getEventLabel(item.event) : item.description;

  return `
    <div style="display: grid; grid-template-columns: 140px 100px 100px 1fr 120px 1fr; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem;">
      <span style="color: #64748b; font-size: 0.8rem; font-variant-numeric: tabular-nums;">${dateStr}</span>
      <span><span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${getCategoryLabel(item.log_name)}</span></span>
      <span><span style="${badgeStyle} padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${eventText}</span></span>
      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${item.subject_name ? `<span style="font-weight: 500;">${item.subject_name}</span>` : ''}
        ${item.subject_type ? `<span style="color: #94a3b8; font-size: 0.75rem; margin-left: 4px;">${item.subject_type}</span>` : ''}
      </span>
      <span>${item.causer ? item.causer.name : '<span style="color: #94a3b8; font-style: italic;">Rendszer</span>'}</span>
      <span style="color: #64748b; font-size: 0.8rem;">${item.changes?.old && item.changes?.attributes ? Object.keys(item.changes.attributes).map(k => `${k}: ${item.changes!.old![k] ?? '—'} → ${item.changes!.attributes![k] ?? '—'}`).join(', ') : ''}</span>
    </div>`;
}

const TABLE_HEADER = `
  <div style="display: grid; grid-template-columns: 140px 100px 100px 1fr 120px 1fr; gap: 8px; padding: 8px 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;">
    <span>Dátum</span><span>Kategória</span><span>Esemény</span><span>Tárgy</span><span>Felhasználó</span><span>Változások</span>
  </div>`;

/** Default - Tevékenységnapló lista */
export const Default: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0;">
            <lucide-icon name="scroll-text" [size]="24"></lucide-icon>
            Tevékenységnapló
          </h1>
          <span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">95 bejegyzés</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <select style="height: 36px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem;">
            <option>Összes kategória</option>
          </select>
          <select style="height: 36px; padding: 0 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem;">
            <option>Összes esemény</option>
          </select>
          <div style="display: flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; height: 36px; flex: 1; min-width: 200px; max-width: 400px;">
            <lucide-icon name="search" [size]="16"></lucide-icon>
            <input type="text" placeholder="Keresés a naplóban..." style="border: none; outline: none; background: transparent; flex: 1; font-size: 0.85rem;" />
          </div>
        </div>

        ${TABLE_HEADER}
        ${MOCK_ITEMS.map(renderRow).join('')}

        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px 0;">
          <button style="width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 8px; background: transparent; opacity: 0.4; cursor: not-allowed; display: flex; align-items: center; justify-content: center;">
            <lucide-icon name="chevron-left" [size]="16"></lucide-icon>
          </button>
          <span style="font-size: 0.85rem; color: #64748b;">1 / 5</span>
          <button style="width: 32px; height: 32px; border: 1px solid #e2e8f0; border-radius: 8px; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <lucide-icon name="chevron-right" [size]="16"></lucide-icon>
          </button>
        </div>
      </div>
    `,
  }),
};

/** Loading - Skeleton betöltés */
export const Loading: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0;">
            <lucide-icon name="scroll-text" [size]="24"></lucide-icon>
            Tevékenységnapló
          </h1>
        </div>
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <div style="height: 44px; border-radius: 8px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; margin-bottom: 8px;"></div>
        }
      </div>
    `,
  }),
};

/** EmptyState - Üres állapot */
export const EmptyState: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0;">
            <lucide-icon name="scroll-text" [size]="24"></lucide-icon>
            Tevékenységnapló
          </h1>
          <span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">0 bejegyzés</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 20px; color: #94a3b8;">
          <lucide-icon name="scroll-text" [size]="48"></lucide-icon>
          <p style="margin-top: 12px; font-size: 0.95rem;">Nincs tevékenységnapló bejegyzés</p>
        </div>
      </div>
    `,
  }),
};

/** DarkMode - Sötét háttéren */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 24px; background: #1e293b; border-radius: 12px; max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0; color: #f1f5f9;">
            <lucide-icon name="scroll-text" [size]="24" style="color: #818cf8;"></lucide-icon>
            Tevékenységnapló
          </h1>
          <span style="background: #334155; color: #94a3b8; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">95 bejegyzés</span>
        </div>
        <div style="display: grid; grid-template-columns: 140px 100px 100px 1fr 120px 1fr; gap: 8px; padding: 8px 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #334155;">
          <span>Dátum</span><span>Kategória</span><span>Esemény</span><span>Tárgy</span><span>Felhasználó</span><span>Változások</span>
        </div>
        ${MOCK_ITEMS.slice(0, 3).map(item => {
          const date = new Date(item.created_at);
          const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          const cls = getEventClass(item.event);
          const badgeStyle = BADGE_STYLES[cls] || BADGE_STYLES['badge-gray'];
          const eventText = item.event ? getEventLabel(item.event) : item.description;
          return `
            <div style="display: grid; grid-template-columns: 140px 100px 100px 1fr 120px 1fr; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #1e293b; font-size: 0.85rem; color: #e2e8f0;">
              <span style="color: #94a3b8; font-size: 0.8rem;">${dateStr}</span>
              <span><span style="background: #334155; color: #94a3b8; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">${getCategoryLabel(item.log_name)}</span></span>
              <span><span style="${badgeStyle} padding: 2px 8px; border-radius: 6px; font-size: 0.75rem;">${eventText}</span></span>
              <span>${item.subject_name ?? ''}</span>
              <span>${item.causer ? item.causer.name : '<span style="color: #64748b; font-style: italic;">Rendszer</span>'}</span>
              <span style="color: #94a3b8; font-size: 0.8rem;">${item.changes?.old && item.changes?.attributes ? Object.keys(item.changes.attributes).map(k => `${k}: ${item.changes!.old![k] ?? '—'} → ${item.changes!.attributes![k] ?? '—'}`).join(', ') : ''}</span>
            </div>`;
        }).join('')}
      </div>
    `,
  }),
};
