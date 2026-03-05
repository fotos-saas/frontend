import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { TemplateListItem } from '@core/services/electron.types';

@Component({
  selector: 'app-template-apply-dialog',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './template-apply-dialog.component.html',
  styleUrl: './template-apply-dialog.component.scss',
})
export class TemplateApplyDialogComponent {
  protected readonly ICONS = ICONS;

  readonly templates = input.required<TemplateListItem[]>();
  readonly isLoading = input(false);
  readonly isApplying = input(false);
  readonly currentPersonCount = input(0);
  readonly editingId = input<string | null>(null);
  readonly editingNameValue = input('');

  readonly closeEvent = output<void>();
  readonly applyEvent = output<string>();
  readonly deleteTemplate = output<string>();
  readonly startRename = output<TemplateListItem>();
  readonly commitRename = output<void>();
  readonly cancelRename = output<void>();
  readonly editingNameChange = output<string>();

  readonly selectedId = signal<string | null>(null);

  selectTemplate(tmpl: TemplateListItem): void {
    this.selectedId.set(tmpl.id);
  }

  formatDate(isoDate: string): string {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }
}
