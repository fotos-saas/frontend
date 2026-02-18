import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { LucideAngularModule, ArrowLeft, Save, Eye, Code, Type, ChevronDown, Copy, Variable } from 'lucide-angular';

const meta: Meta = {
  title: 'Partner/EmailTemplateEdit',
  decorators: [
    moduleMetadata({
      imports: [LucideAngularModule.pick({ ArrowLeft, Save, Eye, Code, Type, ChevronDown, Copy, Variable })],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj;

/** Default - Sablon szerkesztő vizuális nézet */
export const Default: Story = {
  render: () => ({
    props: {
      activeTab: signal<'visual' | 'html'>('visual'),
      subject: signal('Jelszó visszaállítás kérés - {site_name}'),
      saving: signal(false),
      isDirty: signal(false),
      expandedGroups: signal(new Set(['general', 'user'])),
    },
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto;">
        <!-- Header -->
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <button style="border: none; background: #f1f5f9; padding: 8px; border-radius: 8px; cursor: pointer;">
            <lucide-icon name="arrow-left" [size]="18"></lucide-icon>
          </button>
          <div>
            <h1 style="margin: 0; font-size: 1.25rem;">Jelszó visszaállítás</h1>
            <span style="font-size: 0.75rem; color: #94a3b8;">password_reset</span>
          </div>
          <div style="margin-left: auto; display: flex; gap: 8px;">
            <button style="border: 1px solid #e2e8f0; background: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <lucide-icon name="eye" [size]="16"></lucide-icon> Előnézet
            </button>
            <button style="border: none; background: #6366f1; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; opacity: 0.5;">
              <lucide-icon name="save" [size]="16"></lucide-icon> Mentés
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 280px; gap: 24px;">
          <!-- Editor -->
          <div>
            <!-- Subject -->
            <label style="font-size: 0.875rem; font-weight: 600; color: #475569; margin-bottom: 6px; display: block;">Tárgy</label>
            <input [value]="subject()" style="width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; margin-bottom: 16px; box-sizing: border-box;" />

            <!-- Tab switcher -->
            <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; margin-bottom: 12px; width: fit-content;">
              <button (click)="activeTab.set('visual')"
                [style.background]="activeTab() === 'visual' ? 'white' : 'transparent'"
                [style.box-shadow]="activeTab() === 'visual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'"
                style="border: none; padding: 6px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem;">
                <lucide-icon name="type" [size]="14"></lucide-icon> Vizuális
              </button>
              <button (click)="activeTab.set('html')"
                [style.background]="activeTab() === 'html' ? 'white' : 'transparent'"
                [style.box-shadow]="activeTab() === 'html' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'"
                style="border: none; padding: 6px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.8rem;">
                <lucide-icon name="code" [size]="14"></lucide-icon> HTML
              </button>
            </div>

            <!-- Editor area -->
            @if (activeTab() === 'visual') {
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; min-height: 300px; padding: 16px;">
                <p style="color: #64748b; font-style: italic;">Vizuális szerkeszto terület (Quill editor)</p>
              </div>
            } @else {
              <textarea style="width: 100%; min-height: 300px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-family: monospace; font-size: 0.8rem; resize: vertical; box-sizing: border-box;">
&lt;h2&gt;Kedves &#123;user_name&#125;!&lt;/h2&gt;
&lt;p&gt;Jelszó visszaállítási kérést kaptunk a fiókodhoz.&lt;/p&gt;
              </textarea>
            }
          </div>

          <!-- Variables sidebar -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; height: fit-content; position: sticky; top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 0.875rem; display: flex; align-items: center; gap: 6px;">
              <lucide-icon name="variable" [size]="16" style="color: #6366f1;"></lucide-icon>
              Változók
            </h3>
            @for (group of ['Általános', 'Felhasználó', 'Hitelesítés']; track group) {
              <div style="margin-bottom: 8px;">
                <button style="width: 100%; text-align: left; border: none; background: none; padding: 6px 0; cursor: pointer; font-weight: 600; font-size: 0.8rem; color: #475569; display: flex; align-items: center; gap: 4px;">
                  <lucide-icon name="chevron-down" [size]="14"></lucide-icon> {{ group }}
                </button>
                <div style="padding-left: 18px;">
                  @for (v of ['site_name', 'current_date']; track v) {
                    <button style="display: flex; align-items: center; gap: 4px; border: none; background: white; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-family: monospace; margin-bottom: 4px; color: #6366f1; width: 100%; text-align: left; border: 1px solid #e2e8f0;">
                      <lucide-icon name="copy" [size]="12"></lucide-icon> &#123;{{ v }}&#125;
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    `,
  }),
};

/** WithSelection - Módosított sablon (isDirty) */
export const WithChanges: Story = {
  render: () => ({
    props: {
      activeTab: signal<'visual' | 'html'>('visual'),
      subject: signal('Jelszó visszaállítás - Módosított tárgy'),
      isDirty: signal(true),
    },
    template: `
      <div class="page-card" style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <button style="border: none; background: #f1f5f9; padding: 8px; border-radius: 8px; cursor: pointer;">
            <lucide-icon name="arrow-left" [size]="18"></lucide-icon>
          </button>
          <div>
            <h1 style="margin: 0; font-size: 1.25rem;">Jelszó visszaállítás</h1>
            <span style="font-size: 0.75rem; color: #f59e0b; font-weight: 600;">Mentetlen változások</span>
          </div>
          <div style="margin-left: auto; display: flex; gap: 8px;">
            <button style="border: none; background: #6366f1; color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <lucide-icon name="save" [size]="16"></lucide-icon> Mentés
            </button>
          </div>
        </div>
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; min-height: 200px; padding: 16px;">
          <p>Szerkesztett tartalom...</p>
        </div>
      </div>
    `,
  }),
};

/** DarkMode */
export const DarkMode: Story = {
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 20px; background: #1e293b; border-radius: 12px; max-width: 800px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 1.25rem; color: #f1f5f9;">Sablon szerkesztő</h1>
        </div>
        <label style="font-size: 0.875rem; font-weight: 600; color: #94a3b8; margin-bottom: 6px; display: block;">Tárgy</label>
        <input value="Jelszó visszaállítás" style="width: 100%; padding: 10px 14px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: #f1f5f9; font-size: 0.875rem; margin-bottom: 16px; box-sizing: border-box;" />
        <div style="border: 1px solid #334155; border-radius: 8px; min-height: 200px; padding: 16px; background: #0f172a; color: #94a3b8;">
          Email sablon tartalma...
        </div>
      </div>
    `,
  }),
};
