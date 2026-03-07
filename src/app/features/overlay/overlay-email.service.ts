import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoggerService } from '../../core/services/logger.service';
import { OverlayProjectService, ProjectMeta } from './overlay-project.service';

interface EmailTemplateListItem {
  name: string;
  display_name: string;
  subject: string;
  category: string;
}

interface EmailTemplateDetail {
  name: string;
  subject: string;
  body: string;
  available_variables: string[];
}

@Injectable()
export class OverlayEmailService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly logger = inject(LoggerService);
  private readonly projectService = inject(OverlayProjectService);

  readonly panelOpen = signal(false);
  readonly loading = signal(false);
  readonly templates = signal<EmailTemplateListItem[]>([]);
  readonly selectedTemplateName = signal<string | null>(null);
  readonly resolvedSubject = signal('');
  readonly resolvedBody = signal('');
  readonly contactName = signal('');
  readonly contactEmail = signal('');
  readonly copyFeedback = signal<string | null>(null);

  private meta: ProjectMeta | null = null;

  readonly hasTemplates = computed(() => this.templates().length > 0);

  /**
   * Panel megnyitása: meta adatok + tablo kategóriás sablonok lekérése.
   */
  async openPanel(projectId: number | null): Promise<void> {
    if (!projectId) return;
    this.panelOpen.set(true);
    this.loading.set(true);

    try {
      // Meta adatok és sablonlista párhuzamosan
      const [meta, templatesRes] = await Promise.all([
        this.projectService.fetchProjectMeta(projectId),
        firstValueFrom(this.http.get<{ data: EmailTemplateListItem[] }>(
          `${environment.apiUrl}/partner/email-templates`
        )),
      ]);

      this.meta = meta;

      // Csak tablo kategóriás sablonok
      const tabloTemplates = (templatesRes.data || []).filter(t => t.category === 'tablo');

      this.ngZone.run(() => {
        this.templates.set(tabloTemplates);
        this.contactName.set(meta?.contactName ?? '');
        this.contactEmail.set(meta?.contactEmail ?? '');

        // Ha van tablo_sample_ready, azt válasszuk alapból
        const defaultTemplate = tabloTemplates.find(t => t.name === 'tablo_sample_ready');
        if (defaultTemplate) {
          this.selectTemplate(defaultTemplate.name);
        } else if (tabloTemplates.length > 0) {
          this.selectTemplate(tabloTemplates[0].name);
        }

        this.loading.set(false);
      });
    } catch (e) {
      this.logger.error('[EMAIL] openPanel error:', e);
      this.ngZone.run(() => this.loading.set(false));
    }
  }

  /**
   * Sablon kiválasztása és placeholder-ek kitöltése.
   */
  async selectTemplate(name: string): Promise<void> {
    this.selectedTemplateName.set(name);

    try {
      const res = await firstValueFrom(this.http.get<{ data: EmailTemplateDetail }>(
        `${environment.apiUrl}/partner/email-templates/${name}`
      ));

      const template = res.data;
      const subject = this.replacePlaceholders(template.subject);
      const body = this.stripHtmlTags(this.replacePlaceholders(template.body));

      this.ngZone.run(() => {
        this.resolvedSubject.set(subject);
        this.resolvedBody.set(body);
      });
    } catch (e) {
      this.logger.error('[EMAIL] selectTemplate error:', e);
    }
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedTemplateName.set(null);
    this.resolvedSubject.set('');
    this.resolvedBody.set('');
    this.templates.set([]);
  }

  /**
   * Szöveg vágólapra másolása + rövid feedback.
   */
  async copyToClipboard(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.copyFeedback.set(label);
      setTimeout(() => this.ngZone.run(() => this.copyFeedback.set(null)), 1500);
    } catch (e) {
      this.logger.error('[EMAIL] clipboard error:', e);
    }
  }

  /**
   * Placeholder-ek cseréje a meta adatok alapján.
   */
  private replacePlaceholders(text: string): string {
    if (!this.meta) return text;

    const replacements: Record<string, string> = {
      '{contact_name}': this.meta.contactName,
      '{contact_email}': this.meta.contactEmail,
      '{school_name}': this.meta.schoolName,
      '{class_name}': this.meta.className,
      '{partner_name}': this.meta.partnerName,
      '{partner_company}': this.meta.partnerCompany,
    };

    let result = text;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replaceAll(placeholder, value);
    }
    return result;
  }

  /**
   * HTML tagek eltávolítása (plain text-hez a copy-hoz).
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
