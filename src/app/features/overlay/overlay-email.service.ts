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
  /** HTML body — megjelenítéshez és rich text copy-hoz */
  readonly resolvedBodyHtml = signal('');
  readonly contactName = signal('');
  readonly contactEmail = signal('');
  readonly copyFeedback = signal<string | null>(null);

  private meta: ProjectMeta | null = null;

  /** Overlay sablonok (tablo_sample_ready, tablo_modifications_done, stb.) */
  private readonly OVERLAY_TEMPLATES = new Set([
    'tablo_sample_ready',
    'tablo_modifications_done',
    'tablo_pre_finalization',
    'tablo_finalized_sent',
    'tablo_finalized_simple',
  ]);

  readonly hasTemplates = computed(() => this.templates().length > 0);

  /**
   * Panel megnyitása: meta adatok + overlay-specifikus sablonok lekérése.
   */
  async openPanel(projectId: number | null): Promise<void> {
    if (!projectId) return;
    this.panelOpen.set(true);
    this.loading.set(true);

    try {
      const [meta, templatesRes] = await Promise.all([
        this.projectService.fetchProjectMeta(projectId),
        firstValueFrom(this.http.get<{ data: EmailTemplateListItem[] }>(
          `${environment.apiUrl}/partner/email-templates`
        )),
      ]);

      this.meta = meta;

      // Csak a kiküldős overlay sablonok
      const overlayTemplates = (templatesRes.data || [])
        .filter(t => this.OVERLAY_TEMPLATES.has(t.name));

      this.ngZone.run(() => {
        this.templates.set(overlayTemplates);
        this.contactName.set(meta?.contactName ?? '');
        this.contactEmail.set(meta?.contactEmail ?? '');

        const defaultTemplate = overlayTemplates.find(t => t.name === 'tablo_sample_ready');
        if (defaultTemplate) {
          this.selectTemplate(defaultTemplate.name);
        } else if (overlayTemplates.length > 0) {
          this.selectTemplate(overlayTemplates[0].name);
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
      const bodyHtml = this.replacePlaceholders(template.body);

      this.ngZone.run(() => {
        this.resolvedSubject.set(subject);
        this.resolvedBodyHtml.set(bodyHtml);
      });
    } catch (e) {
      this.logger.error('[EMAIL] selectTemplate error:', e);
    }
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedTemplateName.set(null);
    this.resolvedSubject.set('');
    this.resolvedBodyHtml.set('');
    this.templates.set([]);
  }

  /**
   * Plain text vágólapra másolás (címzett, tárgy).
   */
  async copyText(text: string, label: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showFeedback(label);
    } catch (e) {
      this.logger.error('[EMAIL] clipboard error:', e);
    }
  }

  /**
   * Rich text (HTML) vágólapra másolás — Gmail-be paste-olva formázott marad.
   * A <p> tageknek inline margin kell, különben Gmail-ben összefolynak.
   */
  async copyHtml(html: string, label: string): Promise<void> {
    try {
      const blob = new Blob([html], { type: 'text/html' });
      const plainText = this.htmlToPlainText(html);
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': blob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([item]);
      this.showFeedback(label);
    } catch (e) {
      // Fallback: plain text copy
      this.logger.error('[EMAIL] rich copy fallback:', e);
      await this.copyText(this.htmlToPlainText(html), label);
    }
  }

  private showFeedback(label: string): void {
    this.copyFeedback.set(label);
    setTimeout(() => this.ngZone.run(() => this.copyFeedback.set(null)), 1500);
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
      '{partner_email}': this.meta.partnerEmail,
      '{partner_phone}': this.meta.partnerPhone,
    };

    let result = text;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replaceAll(placeholder, value);
    }
    return result;
  }

  /**
   * HTML → plain text (fallback clipboard-hoz).
   */
  private htmlToPlainText(html: string): string {
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
