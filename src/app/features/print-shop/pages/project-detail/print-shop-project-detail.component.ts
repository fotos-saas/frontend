import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, filter } from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PrintShopService } from '../../services/print-shop.service';
import { PrintShopProjectDetail } from '../../models/print-shop.models';
import { PrintShopMessage } from '@core/models/print-order.models';
import { PrintMessagesComponent } from '@shared/components/print-messages/print-messages.component';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-print-shop-project-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideAngularModule,
    MatTooltipModule,
    FormsModule,
    RouterModule,
    PrintMessagesComponent,
  ],
  templateUrl: './print-shop-project-detail.component.html',
  styleUrl: './print-shop-project-detail.component.scss',
})
export class PrintShopProjectDetailComponent implements OnInit {
  private service = inject(PrintShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  project = signal<PrintShopProjectDetail | null>(null);
  messages = signal<PrintShopMessage[]>([]);
  loading = signal(true);
  loadingMessages = signal(true);
  sendingMessage = signal(false);
  respondingDeadline = signal(false);

  // Határidő módosítás form
  showDeadlineForm = signal(false);
  proposedDate = signal('');
  deadlineMessage = signal('');

  readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject(id);
    this.loadMessages(id);

    // 15 másodperces polling az új üzenetekért
    interval(5_000).pipe(
      filter(() => !!this.project()),
      switchMap(() => this.service.getMessages(id)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(msgs => this.messages.set(msgs));
  }

  private loadProject(id: number): void {
    this.service
      .getProject(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/print-shop/projects']),
      });
  }

  private loadMessages(id: number): void {
    this.service
      .getMessages(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msgs) => {
          this.messages.set(msgs);
          this.loadingMessages.set(false);
        },
      });
  }

  onSendMessage(text: string): void {
    const id = this.project()?.id;
    if (!id) return;
    this.sendingMessage.set(true);
    this.service
      .sendMessage(id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msg) => {
          this.messages.update((list) => [...list, msg]);
          this.sendingMessage.set(false);
        },
        error: () => this.sendingMessage.set(false),
      });
  }

  acceptDeadline(): void {
    const id = this.project()?.id;
    if (!id) return;
    this.respondingDeadline.set(true);
    this.service
      .respondToDeadline(id, { action: 'accept' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.project.update((p) =>
            p ? { ...p, printDeadlineStatus: 'accepted' } : p
          );
          this.respondingDeadline.set(false);
          this.loadMessages(id);
        },
        error: () => this.respondingDeadline.set(false),
      });
  }

  modifyDeadline(): void {
    const id = this.project()?.id;
    if (!id || !this.proposedDate()) return;
    this.respondingDeadline.set(true);
    this.service
      .respondToDeadline(id, {
        action: 'modify',
        proposed_date: this.proposedDate(),
        message: this.deadlineMessage() || undefined,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.project.update((p) =>
            p
              ? {
                  ...p,
                  printDeadlineStatus: 'modified',
                  printDeadlineProposed: this.proposedDate(),
                }
              : p
          );
          this.showDeadlineForm.set(false);
          this.respondingDeadline.set(false);
          this.loadMessages(id);
        },
        error: () => this.respondingDeadline.set(false),
      });
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  goBack(): void {
    this.router.navigate(['/print-shop/projects']);
  }
}
