import { Component, ChangeDetectionStrategy, inject, computed, output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayEmailService } from '../../overlay-email.service';

@Component({
  selector: 'app-overlay-email-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="email-template-panel">
      <div class="email-template-panel__header">
        <lucide-icon [name]="ICONS.MAIL" [size]="14" />
        <span>Email sablon</span>
        <button class="email-template-panel__close" (click)="closePanel.emit()" type="button">
          <lucide-icon [name]="ICONS.X" [size]="14" />
        </button>
      </div>

      @if (emailService.loading()) {
        <div class="email-template-panel__loading">
          <span class="toolbar__spinner"></span>
          Betöltés...
        </div>
      } @else {
        <div class="email-template-panel__body">
          <!-- Sablon választó -->
          @if (emailService.templates().length > 0) {
            <div class="email-template-panel__selector">
              <select
                class="email-template-panel__select"
                [value]="emailService.selectedTemplateName()"
                (change)="emailService.selectTemplate($any($event.target).value)"
              >
                @for (tmpl of emailService.templates(); track tmpl.name) {
                  <option [value]="tmpl.name">{{ tmpl.display_name }}</option>
                }
              </select>
            </div>
          }

          <!-- Címzett -->
          <div class="email-template-panel__field">
            <div class="email-template-panel__field-header">
              <span class="email-template-panel__field-label">Címzett</span>
              <button
                class="email-template-panel__copy-btn"
                (click)="emailService.copyText(emailService.contactEmail(), 'Címzett'); $event.stopPropagation()"
                matTooltip="Vágólapra másolás"
              >
                <lucide-icon [name]="emailService.copyFeedback() === 'Címzett' ? ICONS.CHECK : ICONS.COPY" [size]="12" />
              </button>
            </div>
            <div class="email-template-panel__field-value">{{ emailService.contactEmail() || '—' }}</div>
          </div>

          <!-- Tárgy -->
          <div class="email-template-panel__field">
            <div class="email-template-panel__field-header">
              <span class="email-template-panel__field-label">Tárgy</span>
              <button
                class="email-template-panel__copy-btn"
                (click)="emailService.copyText(emailService.resolvedSubject(), 'Tárgy'); $event.stopPropagation()"
                matTooltip="Vágólapra másolás"
              >
                <lucide-icon [name]="emailService.copyFeedback() === 'Tárgy' ? ICONS.CHECK : ICONS.COPY" [size]="12" />
              </button>
            </div>
            <div class="email-template-panel__field-value">{{ emailService.resolvedSubject() }}</div>
          </div>

          <!-- Body (HTML formázott) -->
          <div class="email-template-panel__field email-template-panel__field--body">
            <div class="email-template-panel__field-header">
              <span class="email-template-panel__field-label">Szövegtörzs</span>
              <button
                class="email-template-panel__copy-btn"
                (click)="emailService.copyHtml(emailService.resolvedBodyHtml(), 'Body'); $event.stopPropagation()"
                matTooltip="HTML másolás (formázott)"
              >
                <lucide-icon [name]="emailService.copyFeedback() === 'Body' ? ICONS.CHECK : ICONS.COPY" [size]="12" />
              </button>
            </div>
            <div class="email-template-panel__field-value email-template-panel__field-value--html" [innerHTML]="emailBodyHtml()"></div>
          </div>
        </div>
      }
    </div>
  `,
})
export class OverlayEmailPanelComponent {
  protected readonly ICONS = ICONS;
  readonly emailService = inject(OverlayEmailService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly closePanel = output<void>();

  readonly emailBodyHtml = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.emailService.resolvedBodyHtml())
  );
}
