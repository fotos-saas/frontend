import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  output,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { ICONS } from '@shared/constants/icons.constants';
import { LoggerService } from '@core/services/logger.service';
import { ToastService } from '@core/services/toast.service';
import { PartnerOrderSyncService, RemoteProject } from '../../services/partner-order-sync.service';

@Component({
  selector: 'app-sync-dialog',
  standalone: true,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    FormsModule,
    DialogWrapperComponent,
  ],
  templateUrl: './sync-dialog.component.html',
  styleUrl: './sync-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncDialogComponent implements OnInit {
  private readonly syncService = inject(PartnerOrderSyncService);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly close = output<void>();
  readonly synced = output<void>();

  readonly ICONS = ICONS;
  readonly TABLOKIRALY_URL = 'https://tablokiraly.hu';

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly projects = signal<RemoteProject[]>([]);
  readonly syncedCount = signal(0);
  readonly pendingCount = signal(0);
  readonly searchText = signal('');
  readonly syncingIds = signal<Set<number>>(new Set());
  readonly syncAllRunning = signal(false);
  readonly activeTab = signal<'all' | 'pending' | 'synced'>('all');

  readonly filteredProjects = computed(() => {
    const search = this.searchText().toLowerCase().trim();
    const all = this.projects();
    if (!search) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        (p.school?.toLowerCase().includes(search) ?? false) ||
        (p.city?.toLowerCase().includes(search) ?? false) ||
        (p.contact_name?.toLowerCase().includes(search) ?? false)
    );
  });

  readonly visibleProjects = computed(() => {
    const tab = this.activeTab();
    const filtered = this.filteredProjects();
    if (tab === 'pending') return filtered.filter((p) => !p.synced);
    if (tab === 'synced') return filtered.filter((p) => p.synced);
    return filtered;
  });

  ngOnInit(): void {
    this.loadRemoteProjects();
  }

  loadRemoteProjects(): void {
    this.loading.set(true);
    this.error.set(null);

    this.syncService
      .listRemoteProjects()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.projects.set(res.data.projects);
          this.syncedCount.set(res.data.synced_count);
          this.pendingCount.set(res.data.pending_count);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.error?.message || 'Nem sikerült betölteni a projekteket');
          this.loading.set(false);
          this.logger.error('Failed to load remote projects', err);
        },
      });
  }

  syncSingle(project: RemoteProject): void {
    if (this.syncingIds().has(project.remote_id)) return;

    this.syncingIds.update((ids) => {
      const next = new Set(ids);
      next.add(project.remote_id);
      return next;
    });

    this.syncService
      .syncSingle(project.remote_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.syncingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(project.remote_id);
            return next;
          });

          // Frissítsük a lokális listát
          this.projects.update((list) =>
            list.map((p) =>
              p.remote_id === project.remote_id
                ? { ...p, synced: true, local_project_id: res.data.project_id }
                : p
            )
          );
          this.syncedCount.update((c) => c + 1);
          this.pendingCount.update((c) => Math.max(0, c - 1));
          this.toast.success('Szinkronizálva', `${project.name}`);
          this.synced.emit();
        },
        error: (err) => {
          this.syncingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(project.remote_id);
            return next;
          });
          this.toast.error('Hiba', err.error?.message || 'Szinkronizálás sikertelen');
          this.logger.error('Sync single failed', err);
        },
      });
  }

  syncAllPending(): void {
    const pending = this.projects().filter((p) => !p.synced);
    if (pending.length === 0) return;

    this.syncAllRunning.set(true);
    this.syncService
      .triggerSync()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.syncAllRunning.set(false);
          this.loadRemoteProjects();
          this.synced.emit();
          this.toast.success('Mind szinkronizálva', `${pending.length} projekt szinkronizálva`);
        },
        error: (err) => {
          this.syncAllRunning.set(false);
          this.toast.error('Hiba', err.error?.message || 'Szinkronizálás sikertelen');
          this.logger.error('Sync all failed', err);
        },
      });
  }

  navigateToProject(localProjectId: number): void {
    this.close.emit();
    this.router.navigate(['/partner/projects', localProjectId]);
  }

  openInTablokiraly(remoteId: number): void {
    window.open(`${this.TABLOKIRALY_URL}/projects/${remoteId}`, '_blank');
  }
}
