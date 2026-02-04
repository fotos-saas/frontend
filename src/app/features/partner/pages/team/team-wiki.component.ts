import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Team Wiki - Csapatkezelés súgó
 */
@Component({
  selector: 'app-team-wiki',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel dialog-panel--lg" (mousedown)="$event.stopPropagation()">
        <!-- Header -->
        <div class="dialog-header">
          <h2>
            <lucide-icon [name]="ICONS.BOOK_OPEN" [size]="20" />
            Csapatkezelés - Hogyan működik?
          </h2>
          <button class="close-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="dialog-content">
          <!-- Intro -->
          <section class="wiki-section">
            <h3>Miért jó ez neked?</h3>
            <p>
              A Tablóstúdió rendszerben meghívhatsz munkatársakat, akik segítenek a munkádban.
              Nem kell megosztanod a jelszavadat - mindenki a saját fiókjával dolgozik.
            </p>
          </section>

          <!-- Roles -->
          <section class="wiki-section">
            <h3>Szerepkörök</h3>
            <div class="role-list">
              <div class="role-item">
                <div class="role-icon designer">
                  <lucide-icon [name]="ICONS.PALETTE" [size]="20" />
                </div>
                <div class="role-info">
                  <strong>Grafikus</strong>
                  <p>Tablók tervezése és szerkesztése, sablonok kezelése, képek feltöltése és rendezése</p>
                </div>
              </div>

              <div class="role-item">
                <div class="role-icon marketer">
                  <lucide-icon [name]="ICONS.MEGAPHONE" [size]="20" />
                </div>
                <div class="role-info">
                  <strong>Marketinges</strong>
                  <p>Ügyfelek kezelése, projektek nyomon követése, kapcsolattartás az iskolákkal</p>
                </div>
              </div>

              <div class="role-item">
                <div class="role-icon printer">
                  <lucide-icon [name]="ICONS.PRINTER" [size]="20" />
                </div>
                <div class="role-info">
                  <strong>Nyomdász</strong>
                  <p>Nyomtatási feladatok kezelése, rendelések státuszának frissítése, szállítás koordinálása</p>
                </div>
              </div>

              <div class="role-item">
                <div class="role-icon assistant">
                  <lucide-icon [name]="ICONS.CLIPBOARD_LIST" [size]="20" />
                </div>
                <div class="role-info">
                  <strong>Ügyintéző</strong>
                  <p>Irodai adminisztráció, számlázás segítése, ügyfélszolgálat</p>
                </div>
              </div>
            </div>
          </section>

          <!-- How to invite -->
          <section class="wiki-section">
            <h3>Hogyan hívj meg valakit?</h3>
            <ol class="steps-list">
              <li>Kattints a <strong>"Meghívás"</strong> gombra</li>
              <li>Add meg a munkatárs <strong>email címét</strong></li>
              <li>Válaszd ki a <strong>szerepkört</strong></li>
              <li>A meghívott kap egy emailt a belépési kóddal</li>
              <li>Regisztráció után azonnal dolgozhat</li>
            </ol>
          </section>

          <!-- Important notes -->
          <section class="wiki-section">
            <h3>Fontos tudnivalók</h3>
            <ul class="info-list">
              <li>
                <lucide-icon [name]="ICONS.CHECK" [size]="16" />
                Egy munkatárs több stúdiónak is dolgozhat (szabadúszó modell)
              </li>
              <li>
                <lucide-icon [name]="ICONS.CHECK" [size]="16" />
                A meghívott csak azt látja, amihez joga van
              </li>
              <li>
                <lucide-icon [name]="ICONS.CHECK" [size]="16" />
                Bármikor eltávolíthatod a csapatból
              </li>
              <li>
                <lucide-icon [name]="ICONS.CLOCK" [size]="16" />
                A meghívó kód <strong>7 napig</strong> érvényes
              </li>
            </ul>
          </section>
        </div>

        <!-- Footer -->
        <div class="dialog-footer">
          <button class="btn-primary" (click)="close.emit()">Értem</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.15s ease;
    }

    .dialog-panel {
      background: var(--bg-primary, #ffffff);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease;

      &--lg {
        max-width: 600px;
      }
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #e2e8f0);

      h2 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary, #1e293b);
      }
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary, #64748b);

      &:hover {
        background: var(--bg-secondary, #f1f5f9);
      }
    }

    .dialog-content {
      padding: 24px;
      overflow-y: auto;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }

    .wiki-section {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #1e293b);
        margin: 0 0 12px 0;
      }

      p {
        font-size: 14px;
        color: var(--text-secondary, #64748b);
        line-height: 1.6;
        margin: 0;
      }
    }

    .role-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .role-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: var(--bg-secondary, #f8fafc);
      border-radius: 10px;
    }

    .role-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.designer {
        background: #f3e8ff;
        color: #9333ea;
      }
      &.marketer {
        background: #dbeafe;
        color: #2563eb;
      }
      &.printer {
        background: #ffedd5;
        color: #ea580c;
      }
      &.assistant {
        background: #dcfce7;
        color: #16a34a;
      }
    }

    .role-info {
      strong {
        display: block;
        font-size: 14px;
        color: var(--text-primary, #1e293b);
        margin-bottom: 2px;
      }

      p {
        font-size: 13px;
        color: var(--text-secondary, #64748b);
        margin: 0;
        line-height: 1.4;
      }
    }

    .steps-list {
      margin: 0;
      padding-left: 20px;

      li {
        font-size: 14px;
        color: var(--text-secondary, #64748b);
        padding: 6px 0;
        line-height: 1.5;

        strong {
          color: var(--text-primary, #1e293b);
        }
      }
    }

    .info-list {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 14px;
        color: var(--text-secondary, #64748b);
        padding: 8px 0;

        lucide-icon {
          color: #22c55e;
          flex-shrink: 0;
          margin-top: 2px;
        }

        strong {
          color: var(--text-primary, #1e293b);
        }
      }
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: var(--color-primary-dark, #152a45);
      }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 640px) {
      .dialog-panel {
        margin: 16px;
        max-height: calc(100vh - 32px);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamWikiComponent {
  @Output() close = new EventEmitter<void>();

  readonly ICONS = ICONS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());
}
