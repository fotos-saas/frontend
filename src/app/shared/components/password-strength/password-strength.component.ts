import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="password-strength" [class.password-strength--compact]="compact()">
      <!-- Strength bar -->
      <div class="strength-bar-container">
        <div
          class="strength-bar"
          [style.width.%]="strengthPercent()"
          [class]="strengthClass()"
        ></div>
      </div>

      <!-- Compact mode: inline label + tooltip -->
      @if (compact()) {
        <div class="strength-compact">
          <span class="strength-label" [class]="strengthClass()">
            {{ strengthLabel() }}
          </span>

          <!-- Tooltip trigger -->
          <div class="strength-tooltip-wrapper">
            <button
              type="button"
              class="strength-info-btn"
              aria-label="Jelszó követelmények"
              aria-describedby="password-requirements"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 3 3 0 112.871 5.026v.345a.75.75 0 01-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 108.94 6.94zM10 15a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Tooltip content -->
            <div class="strength-tooltip" id="password-requirements" role="tooltip">
              <div class="strength-tooltip__arrow"></div>
              <ul class="strength-tooltip__list">
                @for (req of requirements; track req.label) {
                  <li [class.met]="req.validator(password())">
                    <span class="icon">
                      @if (req.validator(password())) {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                        </svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                        </svg>
                      }
                    </span>
                    {{ req.label }}
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      } @else {
        <!-- Default mode: label + full requirements list -->
        <div class="strength-label" [class]="strengthClass()">
          {{ strengthLabel() }}
        </div>

        <ul class="requirements-list">
          @for (req of requirements; track req.label) {
            <li [class.met]="req.validator(password())">
              <span class="icon">
                @if (req.validator(password())) {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                  </svg>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
                  </svg>
                }
              </span>
              {{ req.label }}
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .password-strength {
      margin-top: 0.5rem;
    }

    .strength-bar-container {
      height: 4px;
      background: var(--surface-200, #e5e7eb);
      border-radius: 2px;
      overflow: hidden;
    }

    .strength-bar {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease, background-color 0.3s ease;
    }

    .strength-bar.weak { background-color: #ef4444; }
    .strength-bar.fair { background-color: #f59e0b; }
    .strength-bar.good { background-color: #10b981; }
    .strength-bar.strong { background-color: #059669; }

    .strength-label {
      font-size: 0.75rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .strength-label.weak { color: #ef4444; }
    .strength-label.fair { color: #f59e0b; }
    .strength-label.good { color: #10b981; }
    .strength-label.strong { color: #059669; }

    /* ============================================
       DEFAULT MODE - Requirements list
    ============================================ */
    .requirements-list {
      list-style: none;
      padding: 0;
      margin: 0.75rem 0 0 0;
      font-size: 0.75rem;
    }

    .requirements-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      color: var(--text-secondary, #6b7280);
      transition: color 0.2s ease;
    }

    .requirements-list li.met {
      color: #10b981;
    }

    .requirements-list .icon {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .requirements-list .icon svg {
      width: 100%;
      height: 100%;
    }

    /* ============================================
       COMPACT MODE - Inline label + tooltip
    ============================================ */
    .password-strength--compact {
      margin-top: 0.375rem;
    }

    .strength-compact {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .strength-info-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.125rem;
      height: 1.125rem;
      padding: 0;
      border: none;
      background: transparent;
      color: #9ca3af;
      cursor: pointer;
      border-radius: 50%;
      transition: color 0.2s, background-color 0.2s;
    }

    .strength-info-btn svg {
      width: 100%;
      height: 100%;
    }

    .strength-info-btn:hover,
    .strength-info-btn:focus {
      color: #6b7280;
      background-color: rgba(0, 0, 0, 0.05);
    }

    .strength-info-btn:focus {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    /* Tooltip wrapper */
    .strength-tooltip-wrapper {
      position: relative;
    }

    /* Tooltip */
    .strength-tooltip {
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%) scale(0.95);
      background: #1f2937;
      color: white;
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s;
      z-index: 50;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .strength-tooltip__arrow {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #1f2937;
    }

    .strength-tooltip__list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .strength-tooltip__list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.125rem 0;
      color: rgba(255, 255, 255, 0.7);
      transition: color 0.15s ease;
    }

    .strength-tooltip__list li.met {
      color: #34d399;
    }

    .strength-tooltip__list .icon {
      width: 0.875rem;
      height: 0.875rem;
      flex-shrink: 0;
    }

    .strength-tooltip__list .icon svg {
      width: 100%;
      height: 100%;
    }

    /* Show tooltip on hover/focus */
    .strength-tooltip-wrapper:hover .strength-tooltip,
    .strength-info-btn:focus + .strength-tooltip,
    .strength-tooltip-wrapper:focus-within .strength-tooltip {
      opacity: 1;
      visibility: visible;
      transform: translateX(-50%) scale(1);
    }

    /* ============================================
       REDUCED MOTION (A11y)
    ============================================ */
    @media (prefers-reduced-motion: reduce) {
      .strength-bar {
        transition: none;
      }

      .strength-tooltip {
        transition: none;
      }

      .strength-info-btn {
        transition: none;
      }

      .requirements-list li {
        transition: none;
      }
    }
  `]
})
export class PasswordStrengthComponent {
  password = input<string>('');
  compact = input<boolean>(false);

  requirements: PasswordRequirement[] = [
    { label: 'Legalább 8 karakter', validator: (p) => p.length >= 8 },
    { label: 'Legalább 1 nagybetű', validator: (p) => /[A-Z]/.test(p) },
    { label: 'Legalább 1 kisbetű', validator: (p) => /[a-z]/.test(p) },
    { label: 'Legalább 1 szám', validator: (p) => /[0-9]/.test(p) },
    { label: 'Legalább 1 speciális karakter', validator: (p) => /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\\/~`]/.test(p) }
  ];

  metCount = computed(() => {
    const pwd = this.password();
    return this.requirements.filter(r => r.validator(pwd)).length;
  });

  strengthPercent = computed(() => {
    const count = this.metCount();
    return (count / this.requirements.length) * 100;
  });

  strengthClass = computed(() => {
    const count = this.metCount();
    if (count <= 1) return 'weak';
    if (count <= 2) return 'fair';
    if (count <= 4) return 'good';
    return 'strong';
  });

  strengthLabel = computed(() => {
    const count = this.metCount();
    if (count <= 1) return 'Gyenge';
    if (count <= 2) return 'Közepes';
    if (count <= 4) return 'Jó';
    return 'Erős';
  });

  isValid = computed(() => {
    return this.metCount() === this.requirements.length;
  });
}
