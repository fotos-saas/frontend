import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDetailData, ProjectContact, QrCode } from '../project-detail.types';
import {
  AddButtonComponent,
  EditButtonComponent,
  DeleteButtonComponent
} from '../../../components/action-buttons';
import { ICONS } from '../../../constants/icons.constants';
import { QR_CODE_TYPES, QrCodeTypeKey } from '../../../constants/qr-code-types';

/**
 * Project Detail View - Közös presentational (dumb) komponens.
 * Az "Áttekintés" tab tartalma (QR, galéria, kontaktok, stb.).
 * A header külön komponensben van (ProjectDetailHeaderComponent).
 */
@Component({
  selector: 'app-project-detail-view',
  standalone: true,
  imports: [
    RouterModule,
    LucideAngularModule,
    MatTooltipModule,
    AddButtonComponent,
    EditButtonComponent,
    DeleteButtonComponent,
  ],
  templateUrl: './project-detail-view.component.html',
  styleUrl: './project-detail-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailViewComponent {
  readonly ICONS = ICONS;

  readonly project = input<ProjectDetailData | null>(null);
  readonly isMarketer = input<boolean>(false);

  readonly openQrModal = output<void>();
  readonly openContactModal = output<ProjectContact | null>();
  readonly deleteContact = output<ProjectContact>();
  readonly qrCodeChanged = output<QrCode | null>();
  readonly openOrderData = output<void>();
  readonly createGallery = output<void>();
  readonly galleryDeadlineExtend = output<number>();

  copiedCodeId: number | null = null;

  readonly deadlineOptions = [
    { days: 1, label: '+1 nap' },
    { days: 3, label: '+3 nap' },
    { days: 7, label: '+1 hét' },
    { days: 14, label: '+2 hét' },
    { days: 21, label: '+3 hét' },
  ];

  isDeadlineExpired(dateStr: string): boolean {
    const deadlineDate = new Date(dateStr + 'T23:59:59');
    return deadlineDate < new Date();
  }

  getTypeConfig(type: string) {
    return QR_CODE_TYPES[type as QrCodeTypeKey] ?? QR_CODE_TYPES['coordinator'];
  }

  copyLink(url: string, codeId: number): void {
    navigator.clipboard.writeText(url).then(() => {
      this.copiedCodeId = codeId;
      setTimeout(() => this.copiedCodeId = null, 2000);
    });
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getQrCodeImageUrl(registrationUrl: string): string {
    const url = encodeURIComponent(registrationUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${url}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
