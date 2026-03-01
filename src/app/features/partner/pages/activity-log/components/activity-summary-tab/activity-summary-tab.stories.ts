import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { LucideAngularModule, CheckCircle, AlertCircle, Layers, Check, Undo2, ChevronLeft, ChevronRight } from 'lucide-angular';
import { ProjectActivitySummary } from '../../../../services/partner-activity.service';

const MOCK_ITEMS: ProjectActivitySummary[] = [
  {
    project_id: 1, project_name: 'Kossuth Lajos Ált. Isk. 8.a',
    activity_count: 45, new_activity_count: 12,
    last_activity_at: '2026-03-01T10:30:00.000Z', reviewed_at: '2026-02-28T14:00:00.000Z',
  },
  {
    project_id: 2, project_name: 'Petőfi Sándor Gimn. 12.b',
    activity_count: 23, new_activity_count: 0,
    last_activity_at: '2026-02-28T09:15:00.000Z', reviewed_at: '2026-02-28T16:00:00.000Z',
  },
  {
    project_id: 3, project_name: 'Arany János Ált. Isk. 5.c',
    activity_count: 8, new_activity_count: 8,
    last_activity_at: '2026-02-27T18:00:00.000Z', reviewed_at: null,
  },
  {
    project_id: 4, project_name: 'Vörösmarty Mihály Gimn. 10.a',
    activity_count: 67, new_activity_count: 3,
    last_activity_at: '2026-02-27T14:22:00.000Z', reviewed_at: '2026-02-26T10:00:00.000Z',
  },
  {
    project_id: 5, project_name: 'Deák Ferenc Ált. Isk. 6.b',
    activity_count: 15, new_activity_count: 0,
    last_activity_at: '2026-02-26T11:00:00.000Z', reviewed_at: '2026-02-27T09:00:00.000Z',
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderRow(item: ProjectActivitySummary): string {
  const hasNew = item.new_activity_count > 0;
  const borderLeft = hasNew ? 'border-left: 3px solid #8b5cf6;' : '';
  const newBadge = hasNew
    ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 600;">${item.new_activity_count}</span>`
    : `<span style="background: #f1f5f9; color: #94a3b8; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 600;">0</span>`;
  const status = !hasNew && item.reviewed_at
    ? `<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;"><lucide-icon name="check-circle" [size]="12"></lucide-icon> Átnézve</span>`
    : hasNew
      ? `<span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;"><lucide-icon name="alert-circle" [size]="12"></lucide-icon> Új!</span>`
      : '';

  return `
    <div style="display: grid; grid-template-columns: 36px 1fr 110px 90px 160px 100px 70px; gap: 8px; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; ${borderLeft}">
      <span><input type="checkbox" style="width: 16px; height: 16px; accent-color: #8b5cf6;" /></span>
      <span style="color: #8b5cf6; font-weight: 500; cursor: pointer;">${item.project_name}</span>
      <span>${newBadge}</span>
      <span><span style="background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 10px; font-size: 0.8rem; font-weight: 600;">${item.activity_count}</span></span>
      <span style="color: #64748b; font-size: 0.8rem; font-variant-numeric: tabular-nums;">${formatDate(item.last_activity_at!)}</span>
      <span>${status}</span>
      <span>
        ${hasNew || !item.reviewed_at
          ? `<button style="width: 30px; height: 30px; border: none; border-radius: 6px; background: #dcfce7; color: #166534; cursor: pointer; display: flex; align-items: center; justify-content: center;"><lucide-icon name="check" [size]="14"></lucide-icon></button>`
          : `<button style="width: 30px; height: 30px; border: none; border-radius: 6px; background: #f1f5f9; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;"><lucide-icon name="undo-2" [size]="14"></lucide-icon></button>`}
      </span>
    </div>`;
}

const TABLE_HEADER = `
  <div style="display: grid; grid-template-columns: 36px 1fr 110px 90px 160px 100px 70px; gap: 8px; padding: 8px 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0;">
    <span></span><span>Projekt</span><span>Új aktivitások</span><span>Összes</span><span>Utolsó aktivitás</span><span>Állapot</span><span>Művelet</span>
  </div>`;

const meta: Meta = {
  title: 'Partner/ActivityLog/SummaryTab',
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ CheckCircle, AlertCircle, Layers, Check, Undo2, ChevronLeft, ChevronRight })],
    }),
  ],
  tags: ['autodocs'],
  parameters: { layout: 'padded', backgrounds: { default: 'light' } },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0;">
            <lucide-icon name="layers" [size]="24"></lucide-icon>
            Projektek összesítve
          </h1>
          <span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">5 projekt</span>
        </div>
        ${TABLE_HEADER}
        ${MOCK_ITEMS.map(renderRow).join('')}
      </div>
    `,
  }),
};

export const WithBatchSelection: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0;">
            <lucide-icon name="layers" [size]="24"></lucide-icon>
            Projektek összesítve
          </h1>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; padding: 8px 12px; margin-bottom: 8px; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 8px;">
          <span style="font-size: 0.85rem; font-weight: 500; color: #8b5cf6;">3 kijelölve</span>
          <button style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: none; border-radius: 6px; background: #8b5cf6; color: #fff; font-size: 0.8rem; font-weight: 500; cursor: pointer;">
            <lucide-icon name="check-circle" [size]="14"></lucide-icon>
            Átnéztem
          </button>
        </div>
        ${TABLE_HEADER}
        ${MOCK_ITEMS.map(renderRow).join('')}
      </div>
    `,
  }),
};

export const EmptyState: Story = {
  render: () => ({
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="display: flex; align-items: center; gap: 8px; font-size: 1.5rem; font-weight: 600; margin: 0;">
            <lucide-icon name="layers" [size]="24"></lucide-icon>
            Projektek összesítve
          </h1>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64px 20px; color: #94a3b8;">
          <lucide-icon name="layers" [size]="48"></lucide-icon>
          <p style="margin-top: 12px; font-size: 0.95rem;">Nincs aktivitással rendelkező projekt</p>
        </div>
      </div>
    `,
  }),
};
