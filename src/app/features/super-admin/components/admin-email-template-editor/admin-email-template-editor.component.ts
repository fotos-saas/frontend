import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  viewChild,
  ElementRef,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QuillEditorComponent, QuillModule } from 'ngx-quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ToastService } from '../../../../core/services/toast.service';
import { SuperAdminService } from '../../services/super-admin.service';
import { GlobalEmailTemplateDetail, EmailVariableGroup } from '../../models/email-template.model';

type EditorTab = 'visual' | 'html';

@Component({
  selector: 'app-admin-email-template-editor',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FormsModule,
    LucideAngularModule,
    MatTooltipModule,
    QuillModule,
    DialogWrapperComponent,
  ],
  templateUrl: './admin-email-template-editor.component.html',
  styleUrl: './admin-email-template-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEmailTemplateEditorComponent {
  protected readonly ICONS = ICONS;

  templateName = input.required<string>();
  closed = output<void>();
  saved = output<void>();

  private readonly service = inject(SuperAdminService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toast = inject(ToastService);

  readonly quillEditorRef = viewChild<QuillEditorComponent>('quillEditor');
  readonly htmlTextareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('htmlTextarea');
  readonly subjectInputRef = viewChild<ElementRef<HTMLInputElement>>('subjectInput');

  protected template = signal<GlobalEmailTemplateDetail | null>(null);
  protected variables = signal<EmailVariableGroup[]>([]);
  protected loading = signal(true);
  protected saving = signal(false);
  protected activeTab = signal<EditorTab>('visual');
  protected expandedGroups = signal<Set<string>>(new Set(['general', 'user']));

  // Szerkesztett értékek
  protected editSubject = signal('');
  protected editBody = signal('');

  // Mobil változók bottom sheet
  protected variablesOpen = signal(false);

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

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);

    this.service.getEmailTemplate(this.templateName())
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
          this.closed.emit();
        },
      });

    this.service.getEmailVariables()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.variables.set(res.data),
      });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected toggleVariables(): void {
    this.variablesOpen.update(v => !v);
  }

  protected closeVariables(): void {
    this.variablesOpen.set(false);
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
      const editor = this.quillEditorRef()?.quillEditor;
      if (editor) {
        const range = editor.getSelection(true);
        editor.insertText(range.index, tag, 'user');
        editor.setSelection(range.index + tag.length, 0);
      }
    } else {
      const textarea = this.htmlTextareaRef()?.nativeElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = this.editBody();
        this.editBody.set(value.substring(0, start) + tag + value.substring(end));
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
          textarea.focus();
        });
      }
    }
  }

  protected insertVariableToSubject(key: string): void {
    const tag = `{${key}}`;
    const inputEl = this.subjectInputRef()?.nativeElement;
    if (inputEl) {
      const start = inputEl.selectionStart ?? this.editSubject().length;
      const end = inputEl.selectionEnd ?? start;
      const value = this.editSubject();
      this.editSubject.set(value.substring(0, start) + tag + value.substring(end));
      setTimeout(() => {
        inputEl.selectionStart = inputEl.selectionEnd = start + tag.length;
        inputEl.focus();
      });
    }
  }

  protected save(): void {
    this.saving.set(true);
    this.service.updateEmailTemplate(this.templateName(), {
      subject: this.editSubject(),
      body: this.editBody(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Mentve', 'A sablon sikeresen mentve');
          this.saved.emit();
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('Hiba', 'A sablon mentése sikertelen');
        },
      });
  }

  protected openPreview(): void {
    this.previewing.set(true);
    this.service.previewEmailTemplate(this.templateName(), {
      subject: this.editSubject(),
      body: this.editBody(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.previewSubject.set(res.data.subject);
          this.previewHtml.set(this.sanitizer.bypassSecurityTrustHtml(DOMPurify.sanitize(res.data.body_html)));
          this.previewOpen.set(true);
          this.previewing.set(false);
        },
        error: () => this.previewing.set(false),
      });
  }

  protected closePreview(): void {
    this.previewOpen.set(false);
  }
}
