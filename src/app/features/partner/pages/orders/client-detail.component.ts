import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '../../../../shared/constants/icons.constants';
import {
  PartnerOrdersService,
  PartnerClientDetails,
  PartnerOrderAlbumSummary
} from '../../services/partner-orders.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { getInitials, formatDateTime } from '../../../../shared/utils/formatters.util';

@Component({
  selector: 'app-partner-client-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, MatTooltipModule, ConfirmDialogComponent],
  template: `
    <div class="partner-client-detail page-card">
      <!-- Loading -->
      @if (loading()) {
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
          <div class="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      }

      @if (!loading() && client()) {
        <!-- Top Bar: Back + Actions -->
        <div class="top-bar">
          <a
            [routerLink]="['/partner/orders/clients']"
            class="back-link"
          >
            <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="16" />
            Vissza
          </a>

          <div class="top-actions">
            @if (client()!.accessCodeEnabled && client()!.accessCode) {
              <button
                (click)="confirmDisableCode()"
                class="action-btn action-btn--warning"
                matTooltip="Kód inaktiválása"
              >
                <lucide-icon [name]="ICONS.BAN" [size]="18" />
              </button>
            }
            <button
              (click)="openEditModal()"
              class="action-btn"
              matTooltip="Szerkesztés"
            >
              <lucide-icon [name]="ICONS.EDIT" [size]="18" />
            </button>
            <button
              (click)="confirmDelete()"
              class="action-btn action-btn--danger"
              [disabled]="client()!.albumsCount > 0"
              [matTooltip]="client()!.albumsCount > 0 ? 'Törléshez először töröld az albumokat' : 'Törlés'"
            >
              <lucide-icon [name]="ICONS.DELETE" [size]="18" />
            </button>
          </div>
        </div>

        <!-- Header -->
        <header class="detail-header">
          <h1 class="detail-title">{{ client()!.name }}</h1>

          <!-- Regisztráció státusz badge-ek -->
          <div class="registration-status-badges">
            @if (client()!.isRegistered) {
              <span class="status-badge status-badge--registered">
                <lucide-icon [name]="ICONS.USER_CHECK" [size]="14" />
                Regisztrált
              </span>
            } @else if (client()!.allowRegistration) {
              <span class="status-badge status-badge--allowed">
                <lucide-icon [name]="ICONS.USER_PLUS" [size]="14" />
                Regisztráció engedélyezve
              </span>
            } @else {
              <span class="status-badge status-badge--disabled">
                <lucide-icon [name]="ICONS.USER_X" [size]="14" />
                Regisztráció nincs engedélyezve
              </span>
            }
          </div>

          <div class="detail-meta">
            @if (client()!.email) {
              <span class="meta-item">
                <lucide-icon [name]="ICONS.MAIL" [size]="14" />
                {{ client()!.email }}
              </span>
            }
            @if (client()!.email && client()!.phone) {
              <span class="meta-separator">·</span>
            }
            @if (client()!.phone) {
              <span class="meta-item">
                <lucide-icon [name]="ICONS.PHONE" [size]="14" />
                {{ client()!.phone }}
              </span>
            }
          </div>
        </header>

        <!-- Access Code Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Belépési kód</h2>

          @if (client()!.accessCodeEnabled && client()!.accessCode) {
            <div class="flex flex-col gap-4">
              <!-- Code + Copy -->
              <div class="flex items-center gap-4">
                <div class="text-3xl font-mono font-bold tracking-widest text-primary-600 dark:text-primary-400 select-all">
                  {{ client()!.accessCode }}
                </div>
                <button
                  (click)="copyCode()"
                  class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  matTooltip="Másolás"
                >
                  <lucide-icon [name]="ICONS.COPY" [size]="18" />
                </button>
              </div>

              <!-- Expiry info + controls -->
              <div class="expiry-section">
                <div class="expiry-row">
                  <span class="expiry-label">Lejárat:</span>
                  <input
                    type="date"
                    [value]="getExpiryDateValue()"
                    (change)="onExpiryDateChange($event)"
                    [min]="getTomorrowDate()"
                    class="expiry-input"
                    [disabled]="extendingCode()"
                  />
                  @if (isCodeExpired()) {
                    <span class="expiry-badge expiry-badge--expired">Lejárt!</span>
                  }
                </div>

                <div class="expiry-row">
                  <span class="expiry-label">Gyors:</span>
                  <div class="extend-buttons">
                    <button
                      (click)="extendExpiry(3)"
                      [disabled]="extendingCode()"
                      class="extend-btn"
                    >
                      +3 nap
                    </button>
                    <button
                      (click)="extendExpiry(7)"
                      [disabled]="extendingCode()"
                      class="extend-btn"
                    >
                      +1 hét
                    </button>
                    <button
                      (click)="extendExpiry(14)"
                      [disabled]="extendingCode()"
                      class="extend-btn"
                    >
                      +2 hét
                    </button>
                    <button
                      (click)="extendExpiry(30)"
                      [disabled]="extendingCode()"
                      class="extend-btn"
                    >
                      +1 hónap
                    </button>
                  </div>
                </div>
              </div>

              @if (client()!.lastLoginAt) {
                <p class="text-sm text-gray-500">
                  Utolsó belépés: {{ formatDate(client()!.lastLoginAt) }}
                </p>
              }
            </div>
          } @else {
            <div class="text-center py-6">
              <lucide-icon [name]="ICONS.KEY" [size]="48" class="mx-auto text-gray-400 mb-3" />
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                Az ügyfélnek nincs aktív belépési kódja
              </p>
              <button
                (click)="generateCode()"
                [disabled]="generatingCode()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                @if (generatingCode()) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                } @else {
                  <lucide-icon [name]="ICONS.REFRESH" [size]="18" />
                }
                Kód generálása
              </button>
            </div>
          }
        </div>

        <!-- Albums Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Albumok ({{ client()!.albums.length }})
            </h2>
            <button
              (click)="openCreateAlbumModal()"
              class="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <lucide-icon [name]="ICONS.PLUS" [size]="16" />
              Új album
            </button>
          </div>

          @if (client()!.albums.length === 0) {
            <div class="text-center py-8">
              <lucide-icon [name]="ICONS.IMAGE" [size]="48" class="mx-auto text-gray-400 mb-3" />
              <p class="text-gray-600 dark:text-gray-400">
                Még nincs album az ügyfélhez
              </p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (album of client()!.albums; track album.id) {
                <div class="album-card">
                  <div
                    class="album-card__main"
                    [routerLink]="['/partner/orders/albums', album.id]"
                  >
                    <div class="flex items-center gap-3">
                      <!-- Thumbnail vagy ikon -->
                      @if (album.thumbnails && album.thumbnails.length > 0) {
                        <img
                          [src]="album.thumbnails[0]"
                          class="album-thumb-single"
                          alt=""
                        />
                      } @else {
                        <div class="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <lucide-icon
                            [name]="album.type === 'selection' ? ICONS.GRID : ICONS.FRAME"
                            [size]="24"
                            class="text-primary-600 dark:text-primary-400"
                          />
                        </div>
                      }
                      <div>
                        <div class="flex items-center gap-2">
                          <h3 class="font-medium text-gray-900 dark:text-white">{{ album.name }}</h3>
                          <span
                            class="px-2 py-0.5 text-xs font-medium rounded"
                            [class]="ordersService.getStatusColor(album.status)"
                          >
                            {{ ordersService.getStatusLabel(album.status) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-gray-500">
                          <span>{{ ordersService.getTypeLabel(album.type) }}</span>
                          <span>•</span>
                          <span>{{ album.photosCount }} kép</span>
                        </div>
                      </div>
                    </div>

                    <lucide-icon [name]="ICONS.CHEVRON_RIGHT" [size]="18" class="text-gray-400" />
                  </div>

                  <!-- Completed album: letöltés és újranyitás gombok -->
                  @if (album.status === 'completed') {
                    <div class="album-card__actions" (click)="$event.stopPropagation()">
                      <div class="album-actions">
                        <!-- Letöltés engedélyezés toggle -->
                        <button
                          class="album-download-toggle"
                          [class.album-download-toggle--active]="album.allowDownload"
                          (click)="toggleDownload(album)"
                          [disabled]="togglingDownloadId() === album.id"
                        >
                          @if (togglingDownloadId() === album.id) {
                            <div class="btn-spinner btn-spinner--small"></div>
                          } @else {
                            <lucide-icon [name]="ICONS.DOWNLOAD" [size]="14" />
                            @if (album.allowDownload) {
                              <span>Letöltés ON</span>
                            } @else {
                              <span>Letöltés OFF</span>
                            }
                          }
                        </button>
                        <button
                          class="album-reopen-btn-inline"
                          (click)="confirmReopenAlbum(album)"
                          [disabled]="togglingAlbumId() === album.id"
                        >
                          @if (togglingAlbumId() === album.id) {
                            <div class="btn-spinner btn-spinner--purple"></div>
                          } @else {
                            <lucide-icon [name]="ICONS.REFRESH" [size]="14" />
                            Újranyitás
                          }
                        </button>
                      </div>
                    </div>
                  }

                  <!-- Album lejárat és aktiválás sor - csak nem completed állapotnál -->
                  @if (album.status !== 'completed') {
                    <div class="album-card__expiry" (click)="$event.stopPropagation()">
                      <div class="album-expiry-info">
                        <lucide-icon [name]="ICONS.CLOCK" [size]="14" />
                        @if (album.expiresAt) {
                          <span>Lejárat: {{ formatExpiryDate(album.expiresAt) }}</span>
                          @if (isAlbumExpired(album.expiresAt)) {
                            <span class="album-expiry-badge album-expiry-badge--expired">Lejárt!</span>
                          }
                        } @else {
                          <span class="text-gray-400">Nincs lejárat</span>
                        }
                      </div>
                      <div class="album-actions">
                        @if (album.expiresAt) {
                          <button
                            class="album-extend-btn"
                            (click)="extendAlbumExpiry(album, 3)"
                            [disabled]="extendingAlbumId() === album.id"
                            matTooltip="+3 nap"
                          >
                            @if (extendingAlbumId() === album.id) {
                              <div class="btn-spinner"></div>
                            } @else {
                              +3 nap
                            }
                          </button>
                        }
                        @if (album.status === 'draft') {
                          <button
                            class="album-activate-btn"
                            (click)="activateAlbum(album)"
                            [disabled]="togglingAlbumId() === album.id || album.photosCount === 0"
                            [matTooltip]="album.photosCount === 0 ? 'Tölts fel képeket' : 'Aktiválás'"
                          >
                            @if (togglingAlbumId() === album.id) {
                              <div class="btn-spinner btn-spinner--white"></div>
                            } @else {
                              <lucide-icon [name]="ICONS.CHECK" [size]="14" />
                              Aktiválás
                            }
                          </button>
                        } @else {
                          <button
                            class="album-deactivate-btn"
                            (click)="deactivateAlbum(album)"
                            [disabled]="togglingAlbumId() === album.id"
                            matTooltip="Inaktiválás"
                          >
                            @if (togglingAlbumId() === album.id) {
                              <div class="btn-spinner"></div>
                            } @else {
                              <lucide-icon [name]="ICONS.BAN" [size]="14" />
                            }
                          </button>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Note -->
        @if (client()!.note) {
          <div class="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Megjegyzés</h3>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">{{ client()!.note }}</p>
          </div>
        }

        <!-- Timestamps -->
        <div class="detail-timestamps">
          <span>Létrehozva: {{ formatDate(client()!.createdAt) }}</span>
          <span>Módosítva: {{ formatDate(client()!.updatedAt) }}</span>
        </div>
      }
    </div>

    <!-- Edit Modal - KÍVÜL a page-card-on! -->
      @if (showEditModal()) {
        <div
          class="dialog-backdrop"
          (mousedown)="editBackdropHandler.onMouseDown($event)"
          (click)="editBackdropHandler.onClick($event)"
        >
          <div class="dialog-panel dialog-panel--md" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Ügyfél szerkesztése</h2>
              <button
                (click)="closeEditModal()"
                class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <lucide-icon [name]="ICONS.X" [size]="20" />
              </button>
            </div>

            <form (ngSubmit)="updateClient()" class="p-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Név <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="editForm.name"
                  name="name"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  [(ngModel)]="editForm.email"
                  name="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefonszám</label>
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  name="phone"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Megjegyzés</label>
                <textarea
                  [(ngModel)]="editForm.note"
                  name="note"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 resize-none"
                ></textarea>
              </div>

              <!-- Regisztráció engedélyezése -->
              <div class="pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
                <label class="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="editForm.allowRegistration"
                    name="allowRegistration"
                    class="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white">
                      Regisztráció engedélyezése
                    </span>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Az ügyfél email/jelszóval regisztrálhat. Ezután csak azzal léphet be, a kód inaktív lesz.
                    </p>
                  </div>
                </label>
              </div>

              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  (click)="closeEditModal()"
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Mégsem
                </button>
                <button
                  type="submit"
                  [disabled]="!editForm.name || saving()"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Mentés
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Create Album Modal -->
      @if (showAlbumModal()) {
        <div
          class="dialog-backdrop"
          (mousedown)="albumBackdropHandler.onMouseDown($event)"
          (click)="albumBackdropHandler.onClick($event)"
        >
          <div class="dialog-panel dialog-panel--md" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Új album</h2>
              <button
                (click)="closeAlbumModal()"
                class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <lucide-icon [name]="ICONS.X" [size]="20" />
              </button>
            </div>

            <form (ngSubmit)="createAlbum()" class="p-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Album neve <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="albumForm.name"
                  name="name"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                  placeholder="pl. Esküvői fotók"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Album típusa <span class="text-red-500">*</span>
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    (click)="albumForm.type = 'selection'"
                    class="p-4 border-2 rounded-lg text-left transition-colors"
                    [class]="albumForm.type === 'selection' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'"
                  >
                    <lucide-icon [name]="ICONS.GRID" [size]="24" class="text-primary-600 dark:text-primary-400 mb-2" />
                    <h3 class="font-medium text-gray-900 dark:text-white">Képválasztás</h3>
                    <p class="text-sm text-gray-500 mt-1">Egyszerű képválasztás</p>
                  </button>
                  <button
                    type="button"
                    (click)="albumForm.type = 'tablo'"
                    class="p-4 border-2 rounded-lg text-left transition-colors"
                    [class]="albumForm.type === 'tablo' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'"
                  >
                    <lucide-icon [name]="ICONS.FRAME" [size]="24" class="text-primary-600 dark:text-primary-400 mb-2" />
                    <h3 class="font-medium text-gray-900 dark:text-white">Tablókép</h3>
                    <p class="text-sm text-gray-500 mt-1">Teljes workflow</p>
                  </button>
                </div>
              </div>

              @if (albumForm.type === 'selection') {
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Min. kiválasztás
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="albumForm.min_selections"
                      name="min_selections"
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max. kiválasztás
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="albumForm.max_selections"
                      name="max_selections"
                      min="1"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              }

              @if (albumForm.type === 'tablo') {
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max. retusálandó kép
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="albumForm.max_retouch_photos"
                    name="max_retouch_photos"
                    min="1"
                    max="20"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="5"
                  />
                </div>
              }

              <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  (click)="closeAlbumModal()"
                  class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Mégsem
                </button>
                <button
                  type="submit"
                  [disabled]="!albumForm.name || !albumForm.type || saving()"
                  class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  Létrehozás
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    <!-- Disable Code Confirm Dialog -->
    @if (showDisableCodeConfirm()) {
      <app-confirm-dialog
        title="Belépési kód inaktiválása"
        [message]="'Biztosan inaktiválni szeretnéd a belépési kódot? Az ügyfél nem fog tudni belépni ezzel a kóddal.'"
        confirmText="Inaktiválás"
        confirmType="warning"
        (resultEvent)="onDisableCodeResult($event)"
      />
    }

    <!-- Delete Confirm Dialog -->
    @if (showDeleteConfirm()) {
      <app-confirm-dialog
        title="Ügyfél törlése"
        [message]="'Biztosan törölni szeretnéd a(z) ' + client()!.name + ' ügyfelet? Ez a művelet nem visszavonható.'"
        confirmText="Törlés"
        confirmType="danger"
        (resultEvent)="onDeleteResult($event)"
      />
    }

    <!-- Reopen Album Confirm Dialog -->
    @if (showReopenConfirm() && albumToReopen()) {
      <app-confirm-dialog
        title="Album újranyitása"
        [message]="'Biztosan újra szeretnéd nyitni a(z) ' + albumToReopen()!.name + ' albumot? Az ügyfél folytathatja a képválasztást.'"
        confirmText="Újranyitás"
        confirmType="primary"
        (resultEvent)="onReopenResult($event)"
      />
    }
  `,
  styles: [`
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 0.875rem;
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .back-link:hover {
      color: var(--color-text-primary, #1e293b);
    }

    :host-context(.dark) .back-link:hover {
      color: #f1f5f9;
    }

    .top-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .action-btn:hover:not(:disabled) {
      background: #f1f5f9;
      color: var(--color-primary, #1e3a5f);
      border-color: var(--color-primary, #1e3a5f);
    }

    .action-btn:disabled {
      color: #cbd5e1;
      cursor: not-allowed;
    }

    .action-btn--danger:hover:not(:disabled) {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    .action-btn--warning:hover:not(:disabled) {
      background: #fffbeb;
      color: #d97706;
      border-color: #fde68a;
    }

    .detail-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .detail-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-text-primary, #1e293b);
      margin: 0 0 8px 0;
    }

    :host-context(.dark) .detail-title {
      color: #f8fafc;
    }

    .registration-status-badges {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      border-radius: 20px;
    }

    .status-badge--registered {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    :host-context(.dark) .status-badge--registered {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border-color: rgba(34, 197, 94, 0.3);
    }

    .status-badge--allowed {
      background: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #93c5fd;
    }

    :host-context(.dark) .status-badge--allowed {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border-color: rgba(59, 130, 246, 0.3);
    }

    .status-badge--disabled {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    :host-context(.dark) .status-badge--disabled {
      background: rgba(100, 116, 139, 0.15);
      color: #94a3b8;
      border-color: rgba(100, 116, 139, 0.3);
    }

    .detail-meta {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      color: #64748b;
      font-size: 0.875rem;
    }

    .meta-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .meta-separator {
      color: #cbd5e1;
    }

    .detail-timestamps {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-top: 32px;
      padding-top: 24px;
      color: #94a3b8;
      font-size: 0.8125rem;
    }

    .expiry-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }

    :host-context(.dark) .expiry-section {
      background: #1e293b;
      border-color: #334155;
    }

    .expiry-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .expiry-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      min-width: 60px;
    }

    .expiry-input {
      padding: 6px 12px;
      font-size: 0.875rem;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      color: #1e293b;
      cursor: pointer;
    }

    .expiry-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    :host-context(.dark) .expiry-input {
      background: #0f172a;
      border-color: #475569;
      color: #f1f5f9;
    }

    .expiry-badge {
      padding: 4px 8px;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
    }

    .expiry-badge--expired {
      background: #fee2e2;
      color: #dc2626;
    }

    :host-context(.dark) .expiry-badge--expired {
      background: rgba(220, 38, 38, 0.2);
      color: #f87171;
    }

    .extend-buttons {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .extend-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #3b82f6;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .extend-btn:hover:not(:disabled) {
      background: #dbeafe;
      border-color: #93c5fd;
    }

    .extend-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :host-context(.dark) .extend-btn {
      background: #1e3a5f;
      border-color: #1e40af;
      color: #93c5fd;
    }

    :host-context(.dark) .extend-btn:hover:not(:disabled) {
      background: #1e40af;
    }

    /* Album thumbnail stílus */
    .album-thumb-single {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Album kártya stílusok */
    .album-card {
      background: #f9fafb;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.15s ease;
    }

    .album-card:hover {
      background: #f3f4f6;
    }

    :host-context(.dark) .album-card {
      background: rgba(55, 65, 81, 0.5);
    }

    :host-context(.dark) .album-card:hover {
      background: #374151;
    }

    .album-card__main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      cursor: pointer;
    }

    .album-card__expiry,
    .album-card__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 8px 16px;
      background: #f1f5f9;
      border-top: 1px solid #e2e8f0;
    }

    .album-card__expiry {
      justify-content: space-between;
    }

    :host-context(.dark) .album-card__expiry,
    :host-context(.dark) .album-card__actions {
      background: rgba(30, 41, 59, 0.5);
      border-color: #334155;
    }

    .album-expiry-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8125rem;
      color: #64748b;
    }

    :host-context(.dark) .album-expiry-info {
      color: #94a3b8;
    }

    .album-expiry-badge {
      padding: 2px 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      border-radius: 4px;
    }

    .album-expiry-badge--expired {
      background: #fee2e2;
      color: #dc2626;
    }

    :host-context(.dark) .album-expiry-badge--expired {
      background: rgba(220, 38, 38, 0.2);
      color: #f87171;
    }

    .album-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Mobil nézet */
    @media (max-width: 480px) {
      /* Thumbnail elrejtése mobilon */
      .album-thumb-single,
      .album-card__main .w-12 {
        display: none;
      }

      .album-card__main {
        padding: 12px;
      }

      /* Album név és státusz kompaktabb */
      .album-card__main h3 {
        font-size: 0.875rem;
      }

      .album-card__main .text-sm {
        font-size: 0.75rem;
      }

      /* Gombok egy sorban, egyenlő szélesség */
      .album-card__actions {
        padding: 8px 12px;
      }

      .album-actions {
        width: 100%;
        justify-content: stretch;
      }

      .album-actions > button {
        flex: 1;
        justify-content: center;
      }
    }

    .album-extend-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #3b82f6;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
      min-width: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .album-extend-btn:hover:not(:disabled) {
      background: #dbeafe;
      border-color: #93c5fd;
    }

    .album-extend-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-extend-btn {
      background: #1e3a5f;
      border-color: #1e40af;
      color: #93c5fd;
    }

    :host-context(.dark) .album-extend-btn:hover:not(:disabled) {
      background: #1e40af;
    }

    .album-activate-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
      background: #16a34a;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-activate-btn:hover:not(:disabled) {
      background: #15803d;
    }

    .album-activate-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .album-deactivate-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      font-size: 0.75rem;
      color: #d97706;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-deactivate-btn:hover:not(:disabled) {
      background: #fef3c7;
      color: #b45309;
    }

    .album-deactivate-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-deactivate-btn {
      background: rgba(217, 119, 6, 0.1);
      border-color: rgba(217, 119, 6, 0.3);
      color: #fbbf24;
    }

    :host-context(.dark) .album-deactivate-btn:hover:not(:disabled) {
      background: rgba(217, 119, 6, 0.2);
    }

    /* Inline reopen gomb - státusz badge mellé */
    .album-reopen-btn-inline {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #7c3aed;
      background: #f5f3ff;
      border: 1px solid #ddd6fe;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-reopen-btn-inline:hover:not(:disabled) {
      background: #ede9fe;
      color: #6d28d9;
    }

    .album-reopen-btn-inline:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-reopen-btn-inline {
      background: rgba(124, 58, 237, 0.1);
      border-color: rgba(124, 58, 237, 0.3);
      color: #a78bfa;
    }

    :host-context(.dark) .album-reopen-btn-inline:hover:not(:disabled) {
      background: rgba(124, 58, 237, 0.2);
    }

    /* Letöltés engedélyezés toggle gomb */
    .album-download-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .album-download-toggle:hover:not(:disabled) {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    .album-download-toggle--active {
      background: #dcfce7;
      border-color: #86efac;
      color: #16a34a;
    }

    .album-download-toggle--active:hover:not(:disabled) {
      background: #bbf7d0;
      border-color: #4ade80;
    }

    .album-download-toggle:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    :host-context(.dark) .album-download-toggle {
      background: #334155;
      border-color: #475569;
      color: #94a3b8;
    }

    :host-context(.dark) .album-download-toggle:hover:not(:disabled) {
      background: #475569;
    }

    :host-context(.dark) .album-download-toggle--active {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.4);
      color: #4ade80;
    }

    :host-context(.dark) .album-download-toggle--active:hover:not(:disabled) {
      background: rgba(34, 197, 94, 0.3);
    }

    .btn-spinner--small {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(100, 116, 139, 0.3);
      border-top-color: #64748b;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .btn-spinner--purple {
      border-color: rgba(124, 58, 237, 0.3);
      border-top-color: #7c3aed;
    }

    :host-context(.dark) .btn-spinner--purple {
      border-color: rgba(167, 139, 250, 0.3);
      border-top-color: #a78bfa;
    }

    .btn-spinner--white {
      border-color: rgba(255, 255, 255, 0.3);
      border-top-color: white;
    }

    .btn-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(59, 130, 246, 0.3);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    :host-context(.dark) .btn-spinner {
      border-color: rgba(147, 197, 253, 0.3);
      border-top-color: #93c5fd;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class PartnerClientDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  ordersService = inject(PartnerOrdersService);
  private toast = inject(ToastService);

  readonly ICONS = ICONS;

  // State
  loading = signal(true);
  saving = signal(false);
  generatingCode = signal(false);
  extendingCode = signal(false);
  extendingAlbumId = signal<number | null>(null);
  togglingAlbumId = signal<number | null>(null);
  togglingDownloadId = signal<number | null>(null);
  client = signal<PartnerClientDetails | null>(null);

  // Modals
  showEditModal = signal(false);
  showAlbumModal = signal(false);
  showDeleteConfirm = signal(false);
  showDisableCodeConfirm = signal(false);
  showReopenConfirm = signal(false);
  albumToReopen = signal<{ id: number; name: string } | null>(null);

  editForm = { name: '', email: '', phone: '', note: '', allowRegistration: false };
  albumForm = {
    name: '',
    type: 'selection' as 'selection' | 'tablo',
    min_selections: null as number | null,
    max_selections: null as number | null,
    max_retouch_photos: 5 as number | null
  };

  editBackdropHandler = createBackdropHandler(() => this.closeEditModal());
  albumBackdropHandler = createBackdropHandler(() => this.closeAlbumModal());

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.loadClient(id);
  }

  loadClient(id: number): void {
    this.loading.set(true);
    this.ordersService.getClient(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (client) => {
        this.client.set(client);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Hiba', 'Az ügyfél nem található');
        this.router.navigate(['/partner/orders/clients']);
      }
    });
  }

  isCodeExpired(): boolean {
    const expiresAt = this.client()?.accessCodeExpiresAt;
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  getExpiryDateValue(): string {
    const expiresAt = this.client()?.accessCodeExpiresAt;
    if (!expiresAt) return '';
    return new Date(expiresAt).toISOString().split('T')[0];
  }

  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  onExpiryDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.value) return;

    const newExpiry = new Date(input.value);
    newExpiry.setHours(23, 59, 59, 999); // Nap végéig érvényes

    this.extendingCode.set(true);
    this.ordersService.extendCode(this.client()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        this.client.set({
          ...c,
          accessCodeExpiresAt: response.data.accessCodeExpiresAt
        });
        this.toast.success('Siker', 'Lejárat módosítva');
        this.extendingCode.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.extendingCode.set(false);
      }
    });
  }

  formatDate(date: string | null): string {
    return formatDateTime(date);
  }

  getInitials(name: string): string {
    return getInitials(name);
  }

  copyCode(): void {
    const code = this.client()?.accessCode;
    if (code) {
      navigator.clipboard.writeText(code);
      this.toast.success('Siker', 'Kód másolva!');
    }
  }

  generateCode(): void {
    this.generatingCode.set(true);
    this.ordersService.generateCode(this.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        this.client.set({
          ...c,
          accessCode: response.data.accessCode,
          accessCodeEnabled: response.data.accessCodeEnabled,
          accessCodeExpiresAt: response.data.accessCodeExpiresAt
        });
        this.toast.success('Siker', 'Belépési kód generálva!');
        this.generatingCode.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.generatingCode.set(false);
      }
    });
  }

  extendExpiry(days: number): void {
    const currentExpiry = this.client()?.accessCodeExpiresAt;
    const baseDate = currentExpiry ? new Date(currentExpiry) : new Date();
    // Ha lejárt, az aktuális dátumtól számoljuk
    const startDate = baseDate < new Date() ? new Date() : baseDate;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    this.extendingCode.set(true);
    this.ordersService.extendCode(this.client()!.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        this.client.set({
          ...c,
          accessCodeExpiresAt: response.data.accessCodeExpiresAt
        });
        this.toast.success('Siker', `Lejárat meghosszabbítva ${days} nappal`);
        this.extendingCode.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.extendingCode.set(false);
      }
    });
  }

  confirmDisableCode(): void {
    this.showDisableCodeConfirm.set(true);
  }

  onDisableCodeResult(result: ConfirmDialogResult): void {
    this.showDisableCodeConfirm.set(false);
    if (result.action === 'confirm') {
      this.disableCode();
    }
  }

  disableCode(): void {
    this.ordersService.disableCode(this.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        const c = this.client()!;
        this.client.set({ ...c, accessCodeEnabled: false });
        this.toast.success('Siker', 'Belépési kód inaktiválva');
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
      }
    });
  }

  // Edit Modal
  openEditModal(): void {
    const c = this.client()!;
    this.editForm = {
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      note: c.note || '',
      allowRegistration: c.allowRegistration ?? false
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
  }

  updateClient(): void {
    if (!this.editForm.name) return;

    this.saving.set(true);
    this.ordersService.updateClient(this.client()!.id, {
      name: this.editForm.name,
      email: this.editForm.email || null,
      phone: this.editForm.phone || null,
      note: this.editForm.note || null,
      allow_registration: this.editForm.allowRegistration
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        this.client.set({
          ...c,
          name: response.data.name,
          email: response.data.email,
          phone: response.data.phone,
          note: response.data.note,
          allowRegistration: response.data.allowRegistration
        });
        this.toast.success('Siker', 'Ügyfél frissítve');
        this.closeEditModal();
        this.saving.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.saving.set(false);
      }
    });
  }

  // Album Modal
  openCreateAlbumModal(): void {
    this.albumForm = {
      name: '',
      type: 'selection',
      min_selections: null,
      max_selections: null,
      max_retouch_photos: 5
    };
    this.showAlbumModal.set(true);
  }

  closeAlbumModal(): void {
    this.showAlbumModal.set(false);
  }

  createAlbum(): void {
    if (!this.albumForm.name || !this.albumForm.type) return;

    this.saving.set(true);
    this.ordersService.createAlbum({
      client_id: this.client()!.id,
      name: this.albumForm.name,
      type: this.albumForm.type,
      min_selections: this.albumForm.min_selections,
      max_selections: this.albumForm.max_selections,
      max_retouch_photos: this.albumForm.max_retouch_photos
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Album létrehozva');
        this.closeAlbumModal();
        this.loadClient(this.client()!.id);
        this.saving.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.saving.set(false);
      }
    });
  }

  // Delete
  confirmDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    this.showDeleteConfirm.set(false);
    if (result.action === 'confirm') {
      this.deleteClient();
    }
  }

  deleteClient(): void {
    this.ordersService.deleteClient(this.client()!.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Siker', 'Ügyfél törölve');
        this.router.navigate(['/partner/orders/clients']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
      }
    });
  }

  // ============================================
  // ALBUM AKTIVÁLÁS/INAKTIVÁLÁS
  // ============================================

  activateAlbum(album: { id: number; photosCount: number }): void {
    if (album.photosCount === 0) {
      this.toast.error('Hiba', 'Tölts fel képeket az aktiváláshoz');
      return;
    }

    this.togglingAlbumId.set(album.id);
    this.ordersService.activateAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        const updatedAlbums = c.albums.map(a =>
          a.id === album.id ? { ...a, status: response.data.status } : a
        );
        this.client.set({ ...c, albums: updatedAlbums });
        this.toast.success('Siker', 'Album aktiválva');
        this.togglingAlbumId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.togglingAlbumId.set(null);
      }
    });
  }

  deactivateAlbum(album: { id: number }): void {
    this.togglingAlbumId.set(album.id);
    this.ordersService.deactivateAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        const updatedAlbums = c.albums.map(a =>
          a.id === album.id ? { ...a, status: response.data.status } : a
        );
        this.client.set({ ...c, albums: updatedAlbums });
        this.toast.success('Siker', 'Album inaktiválva');
        this.togglingAlbumId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.togglingAlbumId.set(null);
      }
    });
  }

  confirmReopenAlbum(album: { id: number; name: string }): void {
    this.albumToReopen.set(album);
    this.showReopenConfirm.set(true);
  }

  onReopenResult(result: ConfirmDialogResult): void {
    this.showReopenConfirm.set(false);
    if (result.action === 'confirm' && this.albumToReopen()) {
      this.reopenAlbum(this.albumToReopen()!);
    }
    this.albumToReopen.set(null);
  }

  reopenAlbum(album: { id: number }): void {
    this.togglingAlbumId.set(album.id);
    this.ordersService.reopenAlbum(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        const updatedAlbums = c.albums.map(a =>
          a.id === album.id ? { ...a, status: response.data.status } : a
        );
        this.client.set({ ...c, albums: updatedAlbums });
        this.toast.success('Siker', 'Album újranyitva - az ügyfél folytathatja');
        this.togglingAlbumId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.togglingAlbumId.set(null);
      }
    });
  }

  // ============================================
  // ALBUM LEJÁRAT KEZELÉS
  // ============================================

  isAlbumExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  formatExpiryDate(expiresAt: string | null): string {
    if (!expiresAt) return '';
    const date = new Date(expiresAt);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  extendAlbumExpiry(album: { id: number; expiresAt: string | null }, days: number): void {
    const currentExpiry = album.expiresAt ? new Date(album.expiresAt) : new Date();
    // Ha lejárt, az aktuális dátumtól számoljuk
    const startDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    const newExpiry = new Date(startDate);
    newExpiry.setDate(newExpiry.getDate() + days);

    this.extendingAlbumId.set(album.id);
    this.ordersService.extendAlbumExpiry(album.id, newExpiry.toISOString()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        // Frissítjük a kliens albumjait lokálisan
        const c = this.client()!;
        const updatedAlbums = c.albums.map(a =>
          a.id === album.id ? { ...a, expiresAt: response.data.expiresAt } : a
        );
        this.client.set({ ...c, albums: updatedAlbums });
        this.toast.success('Siker', `Lejárat meghosszabbítva ${days} nappal`);
        this.extendingAlbumId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.extendingAlbumId.set(null);
      }
    });
  }

  // ============================================
  // ALBUM LETÖLTÉS ENGEDÉLYEZÉS
  // ============================================

  toggleDownload(album: { id: number; allowDownload: boolean }): void {
    this.togglingDownloadId.set(album.id);
    this.ordersService.toggleAlbumDownload(album.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const c = this.client()!;
        const updatedAlbums = c.albums.map(a =>
          a.id === album.id ? { ...a, allowDownload: response.data.allowDownload } : a
        );
        this.client.set({ ...c, albums: updatedAlbums });
        this.toast.success('Siker', response.data.allowDownload ? 'Letöltés engedélyezve' : 'Letöltés letiltva');
        this.togglingDownloadId.set(null);
      },
      error: (err: { error?: { message?: string } }) => {
        this.toast.error('Hiba', err.error?.message || 'Hiba történt');
        this.togglingDownloadId.set(null);
      }
    });
  }
}
