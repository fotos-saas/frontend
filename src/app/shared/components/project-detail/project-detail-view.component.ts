import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProjectDetailData, ProjectContact, QrCode } from './project-detail.types';
import {
  BackButtonComponent,
  QrButtonComponent,
  AddButtonComponent,
  EditButtonComponent,
  DeleteButtonComponent
} from '../../components/action-buttons';
import { ICONS } from '../../constants/icons.constants';

/**
 * Project Detail View - Közös presentational (dumb) komponens.
 * Mind a Marketer, mind a Partner felület használhatja.
 * Nem tartalmaz service inject-et, csak Input/Output-okat.
 */
@Component({
  selector: 'app-project-detail-view',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
    BackButtonComponent,
    QrButtonComponent,
    AddButtonComponent,
    EditButtonComponent,
    DeleteButtonComponent,
  ],
  template: `
    @if (loading()) {
      <div class="flex flex-col items-center justify-center py-16">
        <div class="w-10 h-10 border-3 border-gray-200 border-t-primary rounded-full animate-spin"></div>
        <p class="mt-4 text-gray-500">Betöltés...</p>
      </div>
    } @else if (project()) {
      <!-- Hero Header -->
      <header class="relative mb-8">
        <!-- Top Bar -->
        <div class="flex items-center justify-between mb-6">
          <app-back-button
            [label]="'Vissza'"
            [display]="'icon-text'"
            (clicked)="back.emit()"
          />
          <div class="flex items-center gap-1">
            <button
              class="p-2.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-xl transition-all"
              (click)="editProject.emit()"
              matTooltip="Projekt szerkesztése"
            >
              <lucide-icon [name]="ICONS.EDIT" [size]="18" />
            </button>
            <button
              class="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              (click)="deleteProject.emit()"
              matTooltip="Projekt törlése"
            >
              <lucide-icon [name]="ICONS.DELETE" [size]="18" />
            </button>
          </div>
        </div>
        <!-- Hero Card - Clean version -->
        <div class="text-center py-2">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ project()!.school?.name ?? 'Ismeretlen iskola' }}</h1>
          <div class="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span class="flex items-center gap-1.5">
              <lucide-icon [name]="ICONS.MAP_PIN" [size]="14" class="text-gray-400" />
              {{ project()!.school?.city ?? 'Nincs megadva' }}
            </span>
            <span class="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span class="flex items-center gap-1.5">
              <lucide-icon [name]="ICONS.GRADUATION_CAP" [size]="14" class="text-gray-400" />
              {{ project()!.className ?? '-' }}
              @if (project()!.classYear) {
                <span class="text-gray-400">({{ project()!.classYear }})</span>
              }
            </span>
          </div>
        </div>
      </header>

      <!-- QR Kód - kompakt sor -->
      <section class="mb-6">
        @if (project()!.qrCode) {
          <!-- Van QR kód - kompakt megjelenítés -->
          <div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
            <div class="flex items-center gap-4">
              <img
                [src]="getQrCodeImageUrl(project()!.qrCode!.registrationUrl)"
                [alt]="'QR kód: ' + project()!.qrCode!.code"
                class="w-14 h-14 rounded-lg border border-gray-200"
              />
              <div>
                <div class="flex items-center gap-2">
                  <code class="px-3 py-1 bg-gray-900 text-white text-sm font-mono font-bold tracking-wider rounded-lg">
                    {{ project()!.qrCode!.code }}
                  </code>
                  @if (project()!.qrCode!.isValid) {
                    <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Aktív</span>
                  } @else {
                    <span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Inaktív</span>
                  }
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ project()!.qrCode!.usageCount }}× használva</p>
              </div>
            </div>
            <button
              class="px-4 py-2 text-primary hover:bg-primary-50 text-sm font-medium rounded-lg transition-colors"
              (click)="openQrModal.emit()"
            >
              Részletek
            </button>
          </div>
        } @else {
          <!-- Nincs QR kód - egyszerű generálás sor -->
          <div class="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 border-dashed rounded-xl">
            <div class="flex items-center gap-3">
              <lucide-icon [name]="ICONS.QR_CODE" [size]="20" class="text-gray-400" />
              <span class="text-sm text-gray-500">Nincs QR kód generálva</span>
            </div>
            <button
              class="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              (click)="openQrModal.emit()"
            >
              <lucide-icon [name]="ICONS.PLUS" [size]="16" />
              Generálás
            </button>
          </div>
        }
      </section>

      <!-- Kapcsolattartók -->
      <section class="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <!-- Section Header -->
        <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-semibold text-gray-900">Kapcsolattartók</h2>
          <app-add-button
            [label]="'Új'"
            [variant]="'compact'"
            (clicked)="openContactModal.emit(null)"
          />
        </div>
        <!-- Contact List -->
        <div class="p-4">
          @if (project()!.contacts && project()!.contacts.length > 0) {
            <div class="space-y-2">
              @for (contact of project()!.contacts; track contact.id; let i = $index) {
                <div
                  class="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  [class.bg-primary-50/50]="contact.isPrimary"
                  [style.animation-delay]="i * 0.03 + 's'"
                >
                  <div class="flex items-center gap-3">
                    <!-- Avatar -->
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {{ getInitials(contact.name) }}
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900">{{ contact.name }}</span>
                        @if (contact.isPrimary) {
                          <span class="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded">FŐ</span>
                        }
                      </div>
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-sm text-gray-500">
                        @if (contact.email) {
                          <a [href]="'mailto:' + contact.email" class="hover:text-primary transition-colors flex items-center gap-1">
                            <lucide-icon [name]="ICONS.MAIL" [size]="12" />
                            {{ contact.email }}
                          </a>
                        }
                        @if (contact.phone) {
                          <a [href]="'tel:' + contact.phone" class="hover:text-primary transition-colors flex items-center gap-1">
                            <lucide-icon [name]="ICONS.PHONE" [size]="12" />
                            {{ contact.phone }}
                          </a>
                        }
                      </div>
                    </div>
                  </div>
                  <!-- Actions -->
                  <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <app-edit-button
                      [display]="'icon-only'"
                      (clicked)="openContactModal.emit(contact)"
                    />
                    <app-delete-button
                      [display]="'icon-only'"
                      (clicked)="deleteContact.emit(contact)"
                    />
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Empty State -->
            <div class="text-center py-8">
              <lucide-icon [name]="ICONS.USER_PLUS" [size]="32" class="text-gray-300 mx-auto mb-3" />
              <p class="text-sm text-gray-500 mb-3">Még nincs kapcsolattartó</p>
              <app-add-button
                [label]="'Hozzáadás'"
                [variant]="'primary'"
                (clicked)="openContactModal.emit(null)"
              />
            </div>
          }
        </div>
      </section>

      <!-- QR History -->
      @if (project()!.qrCodesHistory && project()!.qrCodesHistory.length > 0) {
        <section class="mt-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">QR Kód előzmények</h2>
            <span class="text-xs text-gray-400">{{ project()!.qrCodesHistory.length }} kód</span>
          </div>
          <div class="divide-y divide-gray-100">
            @for (qr of project()!.qrCodesHistory; track qr.id) {
              <div class="flex items-center justify-between px-5 py-3">
                <div class="flex items-center gap-3">
                  <code class="font-mono font-semibold text-gray-900">{{ qr.code }}</code>
                  <span class="text-sm text-gray-500">{{ qr.usageCount }}× · {{ formatDateTime(qr.createdAt) }}</span>
                </div>
                @if (qr.isActive) {
                  <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">Aktív</span>
                }
              </div>
            }
          </div>
        </section>
      }

      <!-- Meta Footer -->
      <footer class="mt-6 pt-4 border-t border-gray-100">
        <div class="flex items-center justify-center gap-6 text-xs text-gray-400">
          <span class="flex items-center gap-1.5">
            <lucide-icon [name]="ICONS.CALENDAR" [size]="12" />
            Létrehozva: {{ formatDateTime(project()!.createdAt) }}
          </span>
          <span class="flex items-center gap-1.5">
            <lucide-icon [name]="ICONS.CLOCK" [size]="12" />
            Módosítva: {{ formatDateTime(project()!.updatedAt) }}
          </span>
        </div>
      </footer>
    } @else {
      <div class="text-center py-16">
        <div class="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
          <lucide-icon [name]="ICONS.X_CIRCLE" [size]="32" class="text-red-500" />
        </div>
        <h3 class="mt-3 text-lg font-medium text-gray-900">Projekt nem található</h3>
        <div class="mt-4">
          <app-back-button
            [label]="'Vissza a listához'"
            [display]="'icon-text'"
            (clicked)="back.emit()"
          />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailViewComponent {
  /** ICONS konstansok a template-hez */
  readonly ICONS = ICONS;

  // Inputs - Signal-based (Angular 17+)
  readonly project = input<ProjectDetailData | null>(null);
  readonly loading = input<boolean>(true);

  // Outputs - Signal-based (Angular 17+)
  readonly back = output<void>();
  readonly openQrModal = output<void>();
  readonly openContactModal = output<ProjectContact | null>();
  readonly deleteContact = output<ProjectContact>();
  readonly qrCodeChanged = output<QrCode | null>();
  readonly editProject = output<void>();
  readonly deleteProject = output<void>();

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

  /** QR kód kép URL generálása */
  getQrCodeImageUrl(registrationUrl: string): string {
    const url = encodeURIComponent(registrationUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${url}`;
  }

  /** Név iniciálék lekérése (avatar-hoz) */
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
