import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PsInputComponent } from '@shared/components/form/ps-input/ps-input.component';
import { PsSelectComponent } from '@shared/components/form/ps-select/ps-select.component';
import { PsSelectOption } from '@shared/components/form/form.types';
import { ListPaginationComponent } from '@shared/components/list-pagination/list-pagination.component';
import { ICONS } from '@shared/constants/icons.constants';
import { SuperAdminService } from '../../services/super-admin.service';
import { GlobalEmailTemplateListItem } from '../../models/email-template.model';
import { AdminEmailTemplateEditorComponent } from '../admin-email-template-editor/admin-email-template-editor.component';

type CategoryFilter = string;

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Mind',
  auth: 'Hitelesítés',
  session: 'Munkamenet',
  order: 'Megrendelés',
  tablo: 'Tablófotó',
  general: 'Általános',
  system: 'Rendszer',
  team: 'Csapat',
  subscription: 'Előfizetés',
  connection: 'Kapcsolat',
  guest: 'Vendég',
};

@Component({
  selector: 'app-admin-email-template-manager',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    PsInputComponent,
    PsSelectComponent,
    ListPaginationComponent,
    AdminEmailTemplateEditorComponent,
  ],
  templateUrl: './admin-email-template-manager.component.html',
  styleUrl: './admin-email-template-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEmailTemplateManagerComponent {
  protected readonly ICONS = ICONS;
  protected readonly categoryOptions: PsSelectOption[] = Object.entries(CATEGORY_LABELS).map(([id, label]) => ({ id, label }));

  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly PER_PAGE = 10;

  protected templates = signal<GlobalEmailTemplateListItem[]>([]);
  protected loading = signal(true);
  protected search = signal('');
  protected activeCategory = signal<CategoryFilter>('all');
  protected currentPage = signal(1);
  protected selectedTemplateName = signal<string | null>(null);

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

  protected totalPages = computed(() => Math.max(1, Math.ceil(this.filteredTemplates().length / this.PER_PAGE)));

  protected paginatedTemplates = computed(() => {
    const start = (this.currentPage() - 1) * this.PER_PAGE;
    return this.filteredTemplates().slice(start, start + this.PER_PAGE);
  });

  protected systemCount = computed(() => this.templates().filter(t => t.is_system).length);

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    this.loading.set(true);
    this.service.getEmailTemplates()
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
    this.currentPage.set(1);
  }

  protected setSearch(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  protected openTemplate(template: GlobalEmailTemplateListItem): void {
    this.selectedTemplateName.set(template.name);
  }

  protected onEditorClosed(): void {
    this.selectedTemplateName.set(null);
  }

  protected onEditorSaved(): void {
    this.selectedTemplateName.set(null);
    this.loadTemplates();
  }
}
