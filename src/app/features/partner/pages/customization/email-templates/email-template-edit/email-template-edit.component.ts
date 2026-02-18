import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerEmailTemplateService } from '../../../../services/partner-email-template.service';
import { EmailTemplateDetail, EmailVariableGroup } from '../../../../models/email-template.model';

type EditorTab = 'visual' | 'html';

@Component({
  selector: 'app-email-template-edit',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    QuillModule,
    DialogWrapperComponent,
  ],
  templateUrl: './email-template-edit.component.html',
  styleUrl: './email-template-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateEditComponent {
  protected readonly ICONS = ICONS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(PartnerEmailTemplateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);

  @ViewChild('quillEditor') quillEditorRef?: QuillEditorComponent;
  @ViewChild('htmlTextarea') htmlTextareaRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('subjectInput') subjectInputRef?: ElementRef<HTMLInputElement>;

  protected template = signal<EmailTemplateDetail | null>(null);
  protected variables = signal<EmailVariableGroup[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected activeTab = signal<EditorTab>('visual');
  protected expandedGroups = signal<Set<string>>(new Set(['general', 'user']));

  // Szerkesztett értékek
  protected editSubject = signal('');
  protected editBody = signal('');

  // Előnézet
  protected previewOpen = signal(false);
  protected previewSubject = signal('');
  protected previewHtml = signal<SafeHtml>('');
  protected previewing = signal(false);

  protected quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ header: [1, 2, 3, false] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ color: [] }, { background: [] }],
      ['link', 'blockquote'],
      ['clean'],
    ],
  };

  protected isDirty = computed(() => {
    const t = this.template();
    if (!t) return false;
    return this.editSubject() !== t.subject || this.editBody() !== t.body;
  });

  protected templateName = '';

  constructor() {
    this.templateName = this.route.snapshot.paramMap.get('name') ?? '';
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.service.getTemplate(this.templateName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.template.set(res.data);
          this.editSubject.set(res.data.subject);
          this.editBody.set(res.data.body);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.goBack();
        },
      });

    this.service.getVariables()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.variables.set(res.data),
      });
  }

  protected setTab(tab: EditorTab): void {
    this.activeTab.set(tab);
  }

  protected onQuillContentChanged(event: { html: string | null }): void {
    this.editBody.set(event.html ?? '');
  }

  protected onHtmlChanged(value: string): void {
    this.editBody.set(value);
  }

  protected toggleGroup(group: string): void {
    const current = new Set(this.expandedGroups());
    if (current.has(group)) {
      current.delete(group);
    } else {
      current.add(group);
    }
    this.expandedGroups.set(current);
  }

  protected isGroupExpanded(group: string): boolean {
    return this.expandedGroups().has(group);
  }

  protected insertVariable(key: string): void {
    const tag = `{${key}}`;

    if (this.activeTab() === 'visual') {
      const editor = this.quillEditorRef?.quillEditor;
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertText(range.index, tag, 'user');
        editor.setSelection(range.index + tag.length, 0);
      }
    } else {
      const textarea = this.htmlTextareaRef?.nativeElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = this.editBody();
        this.editBody.set(value.substring(0, start) + tag + value.substring(end));
        // Kurzor pozíció beállítás
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
          textarea.focus();
        });
      }
    }
  }

  protected insertVariableToSubject(key: string): void {
    const tag = `{${key}}`;
    const input = this.subjectInputRef?.nativeElement;
    if (input) {
      const start = input.selectionStart ?? this.editSubject().length;
      const end = input.selectionEnd ?? start;
      const value = this.editSubject();
      this.editSubject.set(value.substring(0, start) + tag + value.substring(end));
      setTimeout(() => {
        input.selectionStart = input.selectionEnd = start + tag.length;
        input.focus();
      });
    }
  }

  protected save(): void {
    this.saving.set(true);
    this.service.updateTemplate(this.templateName, {
      subject: this.editSubject(),
      body: this.editBody(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          // Frissítjük a template-et az új értékekkel
          const current = this.template();
          if (current) {
            this.template.set({
              ...current,
              subject: this.editSubject(),
              body: this.editBody(),
              is_customized: true,
            });
          }
        },
        error: () => this.saving.set(false),
      });
  }

  protected openPreview(): void {
    this.previewing.set(true);
    this.service.preview(this.templateName, {
      subject: this.editSubject(),
      body: this.editBody(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.previewSubject.set(res.data.subject);
          this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(res.data.body_html));
          this.previewOpen.set(true);
          this.previewing.set(false);
        },
        error: () => this.previewing.set(false),
      });
  }

  protected closePreview(): void {
    this.previewOpen.set(false);
  }

  protected goBack(): void {
    const base = this.router.url.replace(/\/customization\/email-templates.*/, '');
    this.router.navigate([`${base}/customization/email-templates`]);
  }
}
