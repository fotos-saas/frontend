import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata, applicationConfig } from '@storybook/angular';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ScanFace, Check, Info, Trash2, Upload,
} from 'lucide-angular';
import { PortraitSettingsComponent } from './portrait-settings.component';

const meta: Meta<PortraitSettingsComponent> = {
  title: 'Shared/PortraitSettings',
  component: PortraitSettingsComponent,
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideAnimationsAsync()],
    }),
    moduleMetadata({
      imports: [
        FormsModule,
        LucideAngularModule.pick({ ScanFace, Check, Info, Trash2, Upload }),
      ],
    }),
  ],
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'light' },
  },
};

export default meta;
type Story = StoryObj<PortraitSettingsComponent>;

/**
 * Default - A komponens HTTP-hívásokat végez ngOnInit-ben.
 * Backend nélkül loading/error állapot jelenik meg.
 */
export const Default: Story = {
  args: { projectId: 1 },
};

/** Loading - Betöltési állapot skeleton shimmer-rel */
export const Loading: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px;">
        <div class="flex items-center justify-center py-12">
          <div style="width: 32px; height: 32px; border: 3px solid #e5e7eb; border-top-color: #1e3a5f; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `,
  }),
};

/** Kikapcsolt - Csak a toggle és info megjelenik */
export const Disabled: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 16px; color: #1e293b;">
          <lucide-icon name="scan-face" [size]="20" style="margin-right: 8px; color: #1e3a5f;" />
          <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Portré háttércsere</h3>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 500; color: #1e293b;">Portré háttércsere engedélyezése</span>
            <br />
            <span style="font-size: 0.8125rem; color: #94a3b8;">
              Bekapcsolás után a desktop alkalmazás automatikusan feldolgozza a portré fotókat.
            </span>
          </div>
          <label style="display: flex; align-items: center; cursor: pointer;">
            <div style="width: 44px; height: 24px; border-radius: 12px; background: #cbd5e1; position: relative; transition: background 0.2s;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: white; position: absolute; top: 2px; left: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
            </div>
            <span style="margin-left: 8px; font-size: 0.875rem; color: #64748b;">Háttércsere aktív</span>
          </label>
        </div>
      </div>
    `,
  }),
};

/** Bekapcsolt - Replace mód preset háttérrel */
export const EnabledReplacePreset: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 16px; color: #1e293b;">
          <lucide-icon name="scan-face" [size]="20" style="margin-right: 8px; color: #1e3a5f;" />
          <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Portré háttércsere</h3>
        </div>

        <!-- Toggle ON -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <div style="margin-bottom: 12px;">
            <span style="font-weight: 500; color: #1e293b;">Portré háttércsere engedélyezése</span>
          </div>
          <label style="display: flex; align-items: center;">
            <div style="width: 44px; height: 24px; border-radius: 12px; background: #1e3a5f; position: relative;">
              <div style="width: 20px; height: 20px; border-radius: 50%; background: white; position: absolute; top: 2px; right: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
            </div>
            <span style="margin-left: 8px; font-size: 0.875rem; color: #1e293b;">Háttércsere aktív</span>
          </label>
        </div>

        <!-- Mód -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <span style="font-weight: 500; color: #1e293b; display: block; margin-bottom: 12px;">Feldolgozási mód</span>
          <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b;">Háttér cseréje</div>
        </div>

        <!-- Háttér típus: Preset -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <span style="font-weight: 500; color: #1e293b; display: block; margin-bottom: 12px;">Háttér típus</span>
          <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b; margin-bottom: 12px;">Előre beállított szín</div>

          <!-- Preset grid -->
          <div style="display: flex; flex-wrap: wrap; margin: -4px; padding: 12px 0;">
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #000000; margin: 4px; background: #000000;"></button>
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #36454F; margin: 4px; background: #36454F; box-shadow: 0 0 0 3px #1e3a5f; display: flex; align-items: center; justify-content: center;">
              <lucide-icon name="check" [size]="16" style="color: white;" />
            </button>
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #555555; margin: 4px; background: #555555;"></button>
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #1B2838; margin: 4px; background: #1B2838;"></button>
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #1A3A5C; margin: 4px; background: #1A3A5C;"></button>
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #ccc; margin: 4px; background: #FFFFFF;"></button>
            <button style="width: 40px; height: 40px; border-radius: 8px; border: 2px solid #D3D3D3; margin: 4px; background: #D3D3D3;"></button>
          </div>
          <div style="display: flex; align-items: center; padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 0.8125rem; color: #94a3b8;">
            <lucide-icon name="info" [size]="14" style="margin-right: 6px;" />
            Kiválasztott: <strong style="color: #334155; margin-left: 4px;">Antracit</strong>
          </div>
        </div>

        <!-- Él feldolgozás -->
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <span style="font-weight: 500; color: #1e293b; display: block; margin-bottom: 4px;">Él feldolgozás</span>
          <span style="font-size: 0.8125rem; color: #94a3b8; display: block; margin-bottom: 12px;">Az alak kontúrjának finomhangolása a természetes megjelenésért.</span>
          <div style="display: flex; margin: -4px;">
            <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">Él behúzás (px)</label><input type="number" value="2" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
            <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">Él lágyítás (px)</label><input type="number" value="3" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
            <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">Él simítás (0-5)</label><input type="number" value="2" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
          </div>
        </div>

        <!-- Mentés -->
        <div style="padding-top: 16px; border-top: 1px solid #e2e8f0;">
          <button style="padding: 8px 20px; background: #1e3a5f; color: white; border: none; border-radius: 8px; font-size: 0.875rem; cursor: pointer;">Mentés</button>
        </div>
      </div>
    `,
  }),
};

/** Egyedi szín - Color picker RGB mezőkkel */
export const CustomColor: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 16px; color: #1e293b;">
          <lucide-icon name="scan-face" [size]="20" style="margin-right: 8px; color: #1e3a5f;" />
          <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Portré háttércsere</h3>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <span style="font-weight: 500; color: #1e293b; display: block; margin-bottom: 12px;">Háttér típus: Egyedi szín</span>
          <div style="display: flex; margin: -4px; margin-bottom: 12px;">
            <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">Piros (R)</label><input type="number" value="30" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
            <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">Zöld (G)</label><input type="number" value="45" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
            <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">Kék (B)</label><input type="number" value="80" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
          </div>
          <div style="width: 100%; height: 48px; border-radius: 8px; border: 1px solid #e2e8f0; background: rgb(30, 45, 80);"></div>
        </div>
      </div>
    `,
  }),
};

/** Gradient - Átmenetes háttér beállítások */
export const Gradient: Story = {
  render: () => ({
    template: `
      <div style="max-width: 600px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="display: flex; align-items: center; margin-bottom: 16px; color: #1e293b;">
          <lucide-icon name="scan-face" [size]="20" style="margin-right: 8px; color: #1e3a5f;" />
          <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">Portré háttércsere</h3>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px;">
          <span style="font-weight: 500; color: #1e293b; display: block; margin-bottom: 12px;">Háttér típus: Átmenet</span>
          <div style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; color: #1e293b; margin-bottom: 12px;">Függőleges</div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 0.8125rem; font-weight: 500; color: #475569; display: block; margin-bottom: 8px;">Kezdő szín</span>
            <div style="display: flex; margin: -4px;">
              <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">R</label><input type="number" value="20" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
              <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">G</label><input type="number" value="30" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
              <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">B</label><input type="number" value="50" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
            </div>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-size: 0.8125rem; font-weight: 500; color: #475569; display: block; margin-bottom: 8px;">Záró szín</span>
            <div style="display: flex; margin: -4px;">
              <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">R</label><input type="number" value="60" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
              <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">G</label><input type="number" value="80" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
              <div style="flex: 1; margin: 4px;"><label style="font-size: 0.75rem; color: #64748b; display: block; margin-bottom: 4px;">B</label><input type="number" value="120" style="width: 100%; padding: 6px 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.875rem;" /></div>
            </div>
          </div>

          <div style="width: 100%; height: 48px; border-radius: 8px; border: 1px solid #e2e8f0; background: linear-gradient(to bottom, rgb(20, 30, 50), rgb(60, 80, 120));"></div>
        </div>
      </div>
    `,
  }),
};

/** DarkMode - Sötét háttéren */
export const DarkMode: Story = {
  args: { projectId: 1 },
  parameters: { backgrounds: { default: 'dark' } },
  render: () => ({
    template: `
      <div style="padding: 20px; background: #1e293b; border-radius: 12px;">
        <app-portrait-settings [projectId]="1" />
      </div>
    `,
  }),
};

/** A11y - Reduced motion tesztelés */
export const A11y: Story = {
  args: { projectId: 1 },
  parameters: {
    a11y: { config: { rules: [{ id: 'color-contrast', enabled: true }] } },
  },
};
