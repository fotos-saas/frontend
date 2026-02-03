import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
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
      <header class="relative mb-6">
        <div class="flex items-start justify-between">
          <app-back-button
            [label]="'Vissza'"
            [display]="'icon-text'"
            (clicked)="back.emit()"
          />
          <app-qr-button
            [variant]="'primary'"
            [isActive]="!!project()!.qrCode"
            [display]="'icon-text'"
            (clicked)="openQrModal.emit()"
          />
        </div>
        <div class="mt-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <h1 class="text-2xl font-bold text-gray-900">{{ project()!.school?.name ?? 'Ismeretlen iskola' }}</h1>
            <button
              class="p-1.5 text-gray-400 hover:text-primary hover:bg-primary-50 rounded-lg transition-colors"
              (click)="editProject.emit()"
              title="Projekt szerkesztése"
            >
              <lucide-icon [name]="ICONS.EDIT" [size]="16" />
            </button>
          </div>
          <p class="mt-1 text-gray-500 flex items-center justify-center gap-1">
            <lucide-icon [name]="ICONS.MAP_PIN" [size]="14" class="inline-flex" />
            {{ project()!.school?.city ?? '' }}
            <span class="mx-2">·</span>
            <lucide-icon [name]="ICONS.GRADUATION_CAP" [size]="14" class="inline-flex" />
            {{ project()!.className ?? '-' }} {{ project()!.classYear ? '(' + project()!.classYear + ')' : '' }}
          </p>
        </div>
      </header>

      <!-- Two Column Layout -->
      <div class="grid md:grid-cols-2 gap-4 mb-4">
        <!-- Kapcsolattartók -->
        <section class="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-gray-900 flex items-center gap-2">
              <span class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <lucide-icon [name]="ICONS.PHONE" [size]="16" class="text-primary" />
              </span>
              Kapcsolattartók
            </h2>
            <app-add-button
              [label]="'Új'"
              [variant]="'compact'"
              (clicked)="openContactModal.emit(null)"
            />
          </div>
          @if (project()!.contacts && project()!.contacts.length > 0) {
            <div class="space-y-2">
              @for (contact of project()!.contacts; track contact.id) {
                <div
                  class="group bg-white rounded-lg p-3 border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
                  [class.border-primary-300]="contact.isPrimary"
                  [class.bg-primary-50/50]="contact.isPrimary"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ contact.name }}</span>
                      @if (contact.isPrimary) {
                        <span class="px-2 py-0.5 bg-primary text-white text-[10px] font-semibold rounded-full">FŐ</span>
                      }
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                  <div class="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                    @if (contact.email) {
                      <a [href]="'mailto:' + contact.email" class="hover:text-primary transition-colors flex items-center gap-1">
                        <lucide-icon [name]="ICONS.MAIL" [size]="14" />
                        {{ contact.email }}
                      </a>
                    }
                    @if (contact.phone) {
                      <a [href]="'tel:' + contact.phone" class="hover:text-primary transition-colors flex items-center gap-1">
                        <lucide-icon [name]="ICONS.SMARTPHONE" [size]="14" />
                        {{ contact.phone }}
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p class="text-gray-400 mb-3">Még nincs kapcsolattartó</p>
              <app-add-button
                [label]="'Hozzáadás'"
                [variant]="'primary'"
                (clicked)="openContactModal.emit(null)"
              />
            </div>
          }
        </section>

        <!-- QR Kód -->
        <section class="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <span class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <lucide-icon [name]="ICONS.QR_CODE" [size]="16" class="text-green-600" />
            </span>
            QR Kód
          </h2>
          @if (project()!.qrCode) {
            <div class="bg-white rounded-lg p-4 border border-gray-100">
              <!-- QR kód kép + kód -->
              <div class="flex flex-col items-center gap-3">
                <!-- QR kód kép -->
                <img
                  [src]="getQrCodeImageUrl(project()!.qrCode!.registrationUrl)"
                  [alt]="'QR kód: ' + project()!.qrCode!.code"
                  class="w-20 h-20 rounded-lg border border-gray-200"
                />
                <!-- Kód -->
                <code class="px-4 py-2 bg-gray-900 text-white text-base font-mono font-bold tracking-wider rounded-lg">
                  {{ project()!.qrCode!.code }}
                </code>
                <!-- Infók -->
                <div class="flex flex-wrap justify-center items-center gap-2 text-sm">
                  <span class="text-gray-600">
                    Használat: <span class="font-semibold text-gray-900">{{ project()!.qrCode!.usageCount }}</span>
                  </span>
                  @if (project()!.qrCode!.isValid) {
                    <span class="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                      <lucide-icon [name]="ICONS.CHECK" [size]="12" /> Aktív
                    </span>
                  } @else {
                    <span class="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                      <lucide-icon [name]="ICONS.X" [size]="12" /> Inaktív
                    </span>
                  }
                </div>
              </div>
              <button
                class="mt-3 w-full text-primary hover:text-primary-dark text-sm font-medium"
                (click)="openQrModal.emit()"
              >Részletek megtekintése →</button>
            </div>
          } @else {
            <div class="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p class="text-gray-400 mb-3">Nincs aktív QR kód</p>
              <app-add-button
                [label]="'Generálás'"
                [variant]="'primary'"
                (clicked)="openQrModal.emit()"
              />
            </div>
          }
        </section>
      </div>

      <!-- QR History -->
      @if (project()!.qrCodesHistory && project()!.qrCodesHistory.length > 0) {
        <section class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4">
          <h2 class="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <span class="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <lucide-icon [name]="ICONS.HISTORY" [size]="16" class="text-amber-600" />
            </span>
            QR Kód előzmények
          </h2>
          <div class="space-y-2">
            @for (qr of project()!.qrCodesHistory; track qr.id) {
              <div
                class="px-3 py-2 rounded-lg text-sm"
                [class.bg-green-50]="qr.isActive"
                [class.bg-gray-50]="!qr.isActive"
              >
                <div class="flex items-center justify-between gap-2">
                  <code class="font-mono font-bold text-gray-900">{{ qr.code }}</code>
                  @if (qr.isActive) {
                    <span class="px-2 py-0.5 bg-green-600 text-white text-xs font-semibold rounded-full">Aktív</span>
                  }
                </div>
                <div class="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>{{ qr.usageCount }}× használat</span>
                  <span>{{ formatDateTime(qr.createdAt) }}</span>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Meta -->
      <footer class="flex justify-center gap-6 pt-4 text-xs text-gray-400">
        <span>Létrehozva: {{ formatDateTime(project()!.createdAt) }}</span>
        <span>Módosítva: {{ formatDateTime(project()!.updatedAt) }}</span>
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
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${url}`;
  }
}
