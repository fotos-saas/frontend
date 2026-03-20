import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailTask, AiInsights, AiResponseType } from '../../../models/email-client.models';

interface ResponseTypeMeta {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

const RESPONSE_TYPE_MAP: Record<AiResponseType, ResponseTypeMeta> = {
  approval: { label: 'Elfogadás', color: '#16a34a', bgColor: '#dcfce7', icon: ICONS.CHECK_CIRCLE },
  conditional_approval: { label: 'Feltételes elfogadás', color: '#2563eb', bgColor: '#dbeafe', icon: ICONS.CHECK_CIRCLE },
  modification_request: { label: 'Módosítási kérés', color: '#d97706', bgColor: '#fef3c7', icon: ICONS.EDIT },
  reversal: { label: 'Visszavonás', color: '#dc2626', bgColor: '#fee2e2', icon: ICONS.UNDO },
  question: { label: 'Kérdés', color: '#7c3aed', bgColor: '#ede9fe', icon: ICONS.HELP_CIRCLE },
  complaint: { label: 'Reklamáció', color: '#dc2626', bgColor: '#fee2e2', icon: ICONS.ALERT_TRIANGLE },
  payment_confirmation: { label: 'Fizetés megerősítés', color: '#16a34a', bgColor: '#dcfce7', icon: ICONS.CREDIT_CARD },
  unclear: { label: 'Nem egyértelmű', color: '#6b7280', bgColor: '#f3f4f6', icon: ICONS.INFO },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: '#dc2626',
  normal: '#2563eb',
  low: '#9ca3af',
};

@Component({
  selector: 'app-email-insights-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    @if (isProcessing()) {
      <div class="insights-panel insights-panel--loading">
        <div class="insights-loading">
          <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
          <span>AI elemzés folyamatban...</span>
        </div>
      </div>
    } @else if (insights()) {
      <div class="insights-panel">
        <!-- Fejléc: szándék badge + kategória + megbízhatóság -->
        <div class="insights-header">
          <div class="insights-header__left">
            <lucide-icon [name]="ICONS.BRAIN" [size]="14" class="insights-icon" />
            <span class="insights-title">AI Elemzés</span>
          </div>
          <div class="insights-header__right">
            @if (responseMeta(); as meta) {
              <span
                class="intent-badge"
                [style.color]="meta.color"
                [style.background-color]="meta.bgColor"
              >
                <lucide-icon [name]="meta.icon" [size]="12" />
                {{ meta.label }}
              </span>
            }
            @if (insights()?.ai_category) {
              <span class="category-chip">{{ categoryLabel() }}</span>
            }
            @if (insights()?.ai_category_confidence) {
              <span class="confidence">{{ confidencePercent() }}% biztos</span>
            }
          </div>
        </div>

        <!-- Ellentmondás figyelmeztetés -->
        @if (insights()?.has_contradictions) {
          <div class="contradiction-warning">
            <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="14" />
            <span>Ellentmondás észlelve a feladatok között!</span>
          </div>
        }

        <!-- Feladatlista -->
        @if (taskItems().length > 0) {
          <div class="task-list">
            @for (task of taskItems(); track task.id) {
              <div class="task-card" [style.border-left-color]="getPriorityColor(task.priority)">
                <div class="task-card__header">
                  <div class="task-card__title-row">
                    @if (task.task_type_label) {
                      <span class="task-type-chip">{{ task.task_type_label }}</span>
                    }
                    <span class="task-card__title">{{ task.title }}</span>
                    @if (task.student_name) {
                      <span class="task-card__student">— {{ task.student_name }}</span>
                    }
                  </div>
                  @if (task.estimated_minutes) {
                    <span class="task-card__time">
                      <lucide-icon [name]="ICONS.CLOCK" [size]="11" />
                      ~{{ task.estimated_minutes }} perc
                    </span>
                  }
                </div>
                @if (task.description) {
                  <p class="task-card__desc">{{ task.description }}</p>
                }
              </div>
            }
          </div>
        }

        <!-- Összesítő sor -->
        @if ((insights()?.task_count ?? 0) > 0 || (insights()?.note_count ?? 0) > 0) {
          <div class="insights-summary">
            <lucide-icon [name]="ICONS.LIST_TODO" [size]="13" />
            <span>
              {{ insights()?.task_count ?? 0 }} feladat
              @if ((insights()?.note_count ?? 0) > 0) {
                , {{ insights()?.note_count }} megjegyzés
              }
              @if ((insights()?.total_estimated_minutes ?? 0) > 0) {
                — ~{{ insights()?.total_estimated_minutes }} perc becsült munka
              }
            </span>
          </div>
        }
      </div>
    }
  `,
  styleUrl: './email-insights-panel.component.scss',
})
export class EmailInsightsPanelComponent {
  readonly ICONS = ICONS;

  readonly tasks = input.required<EmailTask[]>();
  readonly insights = input.required<AiInsights | null>();

  readonly isProcessing = computed(() => !this.insights());

  readonly taskItems = computed(() =>
    this.tasks().filter(t => t.type === 'task')
  );

  readonly confidencePercent = computed(() =>
    Math.round((this.insights()?.ai_category_confidence ?? 0) * 100)
  );

  readonly responseMeta = computed((): ResponseTypeMeta | null => {
    const type = this.insights()?.ai_response_type;
    return type ? RESPONSE_TYPE_MAP[type] ?? null : null;
  });

  readonly categoryLabel = computed(() => {
    const cat = this.insights()?.ai_category;
    if (!cat) return '';
    const labels: Record<string, string> = {
      project: 'Projekt',
      billing: 'Számlázás',
      general: 'Általános',
      spam: 'Spam',
      support: 'Támogatás',
    };
    return labels[cat] ?? cat;
  });

  getPriorityColor(priority: string): string {
    return PRIORITY_COLORS[priority] ?? PRIORITY_COLORS['normal'];
  }
}
