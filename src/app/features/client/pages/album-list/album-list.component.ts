import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ClientService, ClientAlbum } from '../../services/client.service';
import { ICONS } from '../../../../shared/constants/icons.constants';

/**
 * Client Album List - Albumok listája az ügyfél számára
 */
@Component({
  selector: 'app-client-album-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule],
  template: `
    <div class="album-list-page page-card">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">Albumjaim</h1>
          <p class="page-subtitle">Válaszd ki a képeidet az alábbi albumokból</p>
        </div>
      </header>

      <!-- Loading state -->
      @if (loading()) {
        <div class="loading-container">
          <div class="skeleton-grid">
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton-card">
                <div class="skeleton-shimmer skeleton-header"></div>
                <div class="skeleton-shimmer skeleton-body"></div>
                <div class="skeleton-shimmer skeleton-footer"></div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Error state -->
      @if (error()) {
        <div class="error-container">
          <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="48" class="error-icon"></lucide-icon>
          <p class="error-message">{{ error() }}</p>
          <button (click)="loadAlbums()" class="btn btn-primary">
            <lucide-icon [name]="ICONS.REFRESH" [size]="16"></lucide-icon>
            Újrapróbálás
          </button>
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !error() && albums().length === 0) {
        <div class="empty-container">
          <div class="empty-icon-wrapper">
            <lucide-icon [name]="ICONS.IMAGES" [size]="64" class="empty-icon"></lucide-icon>
          </div>
          <h2 class="empty-title">Még nincsenek albumjaid</h2>
          <p class="empty-text">Amint a fotós feltölti a képeket, itt fognak megjelenni.</p>
        </div>
      }

      <!-- Album cards -->
      @if (!loading() && !error() && albums().length > 0) {
        <div class="album-grid">
          @for (album of albums(); track album.id; let i = $index) {
            <a
              [routerLink]="['/client/albums', album.id]"
              class="album-card"
              [style.animation-delay]="(i * 0.05) + 's'"
              [class.album-card--completed]="album.isCompleted"
            >
              <!-- Photo Stack Preview -->
              @if (album.previewThumbs && album.previewThumbs.length > 0) {
                <div class="photo-stack">
                  @for (thumb of album.previewThumbs.slice(0, 4); track thumb; let j = $index) {
                    <div
                      class="stack-photo"
                      [style.background-image]="'url(' + thumb + ')'"
                      [style.--stack-index]="j"
                    ></div>
                  }
                  <div class="stack-overlay">
                    <span class="photo-count">{{ album.photosCount }} kép</span>
                  </div>
                </div>
              } @else {
                <div class="photo-stack photo-stack--empty">
                  <lucide-icon [name]="ICONS.IMAGES" [size]="48" class="stack-empty-icon"></lucide-icon>
                </div>
              }


              <!-- Album info -->
              <div class="card-body">
                <h3 class="album-name">{{ album.name }}</h3>

                <!-- Stats -->
                <div class="album-stats">
                  @if (album.maxSelections) {
                    <div class="stat">
                      <lucide-icon [name]="ICONS.CHECK" [size]="16"></lucide-icon>
                      <span>Max {{ album.maxSelections }} választható</span>
                    </div>
                  }
                  @if (album.minSelections) {
                    <div class="stat">
                      <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16"></lucide-icon>
                      <span>Min {{ album.minSelections }} kötelező</span>
                    </div>
                  }
                </div>

                <!-- Completed badge -->
                @if (album.isCompleted) {
                  <div class="completed-badge">
                    <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="18"></lucide-icon>
                    <span>Lezárva</span>
                  </div>
                }
              </div>

              <!-- Card footer -->
              <div class="card-footer">
                <span class="card-action">
                  @if (album.isCompleted) {
                    Megtekintés
                  } @else {
                    Képek kiválasztása
                  }
                  <lucide-icon [name]="ICONS.ARROW_RIGHT" [size]="16"></lucide-icon>
                </span>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .album-list-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Header */
    .page-header {
      margin-bottom: 24px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* Loading skeleton */
    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .skeleton-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 20px;
      border: 1px solid var(--border-color);
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    .skeleton-header {
      height: 24px;
      width: 40%;
      margin-bottom: 16px;
    }

    .skeleton-body {
      height: 48px;
      margin-bottom: 12px;
    }

    .skeleton-footer {
      height: 16px;
      width: 60%;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error state */
    .error-container {
      text-align: center;
      padding: 48px 24px;
    }

    .error-icon {
      color: #dc2626;
      margin-bottom: 16px;
    }

    .error-message {
      color: var(--text-secondary);
      margin-bottom: 20px;
    }

    /* Empty state */
    .empty-container {
      text-align: center;
      padding: 64px 24px;
    }

    .empty-icon-wrapper {
      display: inline-flex;
      padding: 24px;
      background: var(--surface-hover);
      border-radius: 50%;
      margin-bottom: 20px;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }

    .empty-icon {
      color: var(--text-muted);
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px 0;
    }

    .empty-text {
      color: var(--text-secondary);
      margin: 0;
    }

    /* Album grid */
    .album-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    /* Album card */
    .album-card {
      display: flex;
      flex-direction: column;
      background: var(--surface-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      animation: cardEntry 0.4s ease forwards;
      opacity: 0;
      transform: translateY(10px);
      overflow: hidden;
    }

    /* Photo Stack Preview */
    .photo-stack {
      position: relative;
      height: 200px;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      overflow: hidden;
    }

    .photo-stack--empty {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .stack-empty-icon {
      color: #cbd5e1;
    }

    .stack-photo {
      position: absolute;
      width: 140px;
      height: 105px;
      background-size: cover;
      background-position: center;
      border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.18), 0 3px 6px rgba(0, 0, 0, 0.12);
      border: 4px solid white;
      transition: transform 0.3s ease;
    }

    /* Stacked photo positions - cascading effect */
    .stack-photo:nth-child(1) {
      transform: rotate(-8deg) translate(-35px, 12px);
      z-index: 1;
    }

    .stack-photo:nth-child(2) {
      transform: rotate(-3deg) translate(-12px, -6px);
      z-index: 2;
    }

    .stack-photo:nth-child(3) {
      transform: rotate(4deg) translate(16px, 6px);
      z-index: 3;
    }

    .stack-photo:nth-child(4) {
      transform: rotate(10deg) translate(42px, -10px);
      z-index: 4;
    }

    /* Hover effect - fan out */
    .album-card:hover .stack-photo:nth-child(1) {
      transform: rotate(-14deg) translate(-50px, 10px);
    }

    .album-card:hover .stack-photo:nth-child(2) {
      transform: rotate(-5deg) translate(-18px, -10px);
    }

    .album-card:hover .stack-photo:nth-child(3) {
      transform: rotate(8deg) translate(24px, 8px);
    }

    .album-card:hover .stack-photo:nth-child(4) {
      transform: rotate(16deg) translate(58px, -12px);
    }

    .stack-overlay {
      position: absolute;
      bottom: 12px;
      right: 12px;
      z-index: 10;
    }

    .photo-count {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.7);
      -webkit-backdrop-filter: blur(4px);
      backdrop-filter: blur(4px);
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 20px;
    }

    @keyframes cardEntry {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .album-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    }

    .album-card--completed {
      border-color: #22c55e;
    }

    .album-card--completed:hover {
      border-color: #16a34a;
    }

    /* Card body */
    .card-body {
      flex: 1;
      padding: 16px;
    }

    .album-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 12px 0;
    }

    /* Album stats */
    .album-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      color: var(--text-secondary);
    }

    /* Completed badge */
    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background: #dcfce7;
      color: #166534;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-top: 12px;
    }

    /* Card footer */
    .card-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
      background: var(--surface-hover);
    }

    .card-action {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--primary-color);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .btn-primary:hover {
      background: var(--primary-hover);
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .album-card,
      .empty-icon-wrapper {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    /* Mobile */
    @media (max-width: 640px) {
      .album-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientAlbumListComponent implements OnInit {
  private clientService = inject(ClientService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  albums = signal<ClientAlbum[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAlbums();
  }

  loadAlbums(): void {
    this.loading.set(true);
    this.error.set(null);

    this.clientService.getAlbums().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        // Ha csak 1 album van, egyből átirányítás
        if (response.data.length === 1) {
          this.router.navigate(['/client/albums', response.data[0].id]);
          return;
        }
        this.albums.set(response.data);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }

}
