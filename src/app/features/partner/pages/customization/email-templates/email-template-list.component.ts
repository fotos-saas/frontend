import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PsInputComponent } from '@shared/components/form/ps-input/ps-input.component';
import { PsSelectComponent } from '@shared/components/form/ps-select/ps-select.component';
import { PsSelectOption } from '@shared/components/form/form.types';
import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerEmailTemplateService } from '../../../services/partner-email-template.service';
import { EmailTemplateListItem } from '../../../models/email-template.model';

type CategoryFilter = 'all' | 'auth' | 'session' | 'order' | 'tablo' | 'general';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'Mind',
  auth: 'Hitelesítés',
  session: 'Munkamenet',
  order: 'Megrendelés',
  tablo: 'Tablófotó',
  general: 'Általános',
};

@Component({
  selector: 'app-email-template-list',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, PsInputComponent, PsSelectComponent, ConfirmDialogComponent],
  templateUrl: './email-template-list.component.html',
  styleUrl: './email-template-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateListComponent {
  protected readonly ICONS = ICONS;
  protected readonly CATEGORY_LABELS = CATEGORY_LABELS;
  protected readonly categories: CategoryFilter[] = ['all', 'auth', 'session', 'order', 'tablo', 'general'];
  protected readonly categoryOptions: PsSelectOption[] = this.categories.map(c => ({ id: c, label: CATEGORY_LABELS[c] }));

  private readonly service = inject(PartnerEmailTemplateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected templates = signal<EmailTemplateListItem[]>([]);
  protected loading = signal(true);
  protected search = signal('');
  protected activeCategory = signal<CategoryFilter>('all');
  protected resetConfirm = signal<EmailTemplateListItem | null>(null);
  protected resetting = signal(false);

  protected filteredTemplates = computed(() => {
    let items = this.templates();
    const cat = this.activeCategory();
    if (cat !== 'all') {
      items = items.filter(t => t.category === cat);
    }
    const q = this.search().toLowerCase().trim();
    if (q) {
      items = items.filter(t =>
        t.display_name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
      );
    }
    return items;
  });

  protected customizedCount = computed(() => this.templates().filter(t => t.is_customized).length);

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.loading.set(true);
    this.service.getTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.templates.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  protected setCategory(cat: CategoryFilter): void {
    this.activeCategory.set(cat);
  }

  protected openTemplate(template: EmailTemplateListItem): void {
    const base = this.router.url.replace(/\/customization\/email-templates.*/, '');
    this.router.navigate([`${base}/customization/email-templates`, template.name]);
  }

  protected askReset(template: EmailTemplateListItem, event: MouseEvent): void {
    event.stopPropagation();
    this.resetConfirm.set(template);
  }

  protected confirmReset(result: { action: 'confirm' | 'cancel' }): void {
    const template = this.resetConfirm();
    if (result.action !== 'confirm' || !template) {
      this.resetConfirm.set(null);
      return;
    }
    this.resetting.set(true);
    this.service.resetToDefault(template.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resetConfirm.set(null);
          this.resetting.set(false);
          this.loadTemplates();
        },
        error: () => {
          this.resetConfirm.set(null);
          this.resetting.set(false);
        },
      });
  }
}
