import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { SafeHtmlPipe } from '../../../../pipes/safe-html.pipe';
import { ICONS } from '../../../../constants/icons.constants';
import { ProjectEmail } from '../../../../../features/partner/models/project-email.models';

/**
 * Email tartalom megjelenítő komponens.
 * HTML body renderelés (sanitized), thread, csatolmányok.
 */
@Component({
  selector: 'app-email-detail',
  standalone: true,
  imports: [LucideAngularModule, DatePipe, DecimalPipe, SafeHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './email-detail.component.html',
  styleUrl: './email-detail.component.scss',
})
export class EmailDetailComponent {
  readonly email = input.required<ProjectEmail>();
  readonly thread = input<ProjectEmail[]>([]);
  readonly loading = input(false);

  readonly reply = output<void>();
  readonly markReplied = output<void>();
  readonly close = output<void>();
  readonly downloadAttachment = output<number>();

  /** Éppen letöltődő csatolmány indexe */
  readonly downloadingIndex = signal<number | null>(null);

  readonly ICONS = ICONS;

  onDownload(index: number): void {
    this.downloadingIndex.set(index);
    this.downloadAttachment.emit(index);
  }

  clearDownloading(): void {
    this.downloadingIndex.set(null);
  }
}
