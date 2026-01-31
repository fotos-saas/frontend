import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { AuthLayoutComponent } from './auth-layout.component';

const meta: Meta<AuthLayoutComponent> = {
  title: 'Shared/AuthLayout',
  component: AuthLayoutComponent,
  decorators: [
    moduleMetadata({
      imports: [AuthLayoutComponent]
    })
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**Auth Layout - Floating Mesh Aurora háttér**

CSS-only, GPU-accelerated, Safari kompatibilis animált háttér az auth oldalakhoz.

### Jellemzők
- 3 lebegő orb aszinkron animációkkal (20s, 25s, 22s ciklusok)
- Mesh gradient háttér (15s ciklus)
- Grain texture overlay
- Dark mode támogatás
- Reduced motion támogatás (a11y)
- Mobile optimalizáció (kisebb orb-ok)

### Használat
\`\`\`html
<app-auth-layout>
  <div class="your-card">
    <!-- tartalom -->
  </div>
</app-auth-layout>
\`\`\`
        `
      }
    }
  }
};

export default meta;
type Story = StoryObj<AuthLayoutComponent>;

// Default story with sample card
export const Default: Story = {
  render: () => ({
    template: `
      <app-auth-layout>
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Tablókirály</h1>
            <p class="text-gray-600">Jelentkezz be a folytatáshoz</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-900 mb-2">Email cím</label>
              <input
                type="email"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent"
                placeholder="pelda@email.hu"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-900 mb-2">Jelszó</label>
              <input
                type="password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-transparent"
                placeholder="Jelszó"
              />
            </div>

            <button
              class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-md"
            >
              Bejelentkezés
            </button>
          </div>

          <div class="mt-6 pt-6 border-t border-gray-200 text-center">
            <p class="text-gray-600 text-sm">
              Nincs még fiókod?
              <a href="#" class="text-primary hover:text-primary-dark hover:underline font-medium">
                Regisztrálj
              </a>
            </p>
          </div>
        </div>
      </app-auth-layout>
    `
  })
};

// Compact card variant
export const CompactCard: Story = {
  render: () => ({
    template: `
      <app-auth-layout>
        <div class="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <div class="text-center mb-5">
            <h1 class="text-2xl font-bold text-gray-900 mb-1">Elfelejtett jelszó</h1>
            <p class="text-sm text-gray-600">Add meg az email címedet</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-900 mb-1.5">Email cím</label>
              <input
                type="email"
                class="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-light"
                placeholder="pelda@email.hu"
              />
            </div>

            <button
              class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-4 rounded-lg text-sm"
            >
              Jelszó visszaállítás
            </button>
          </div>

          <div class="mt-5 pt-5 border-t border-gray-200 text-center">
            <a href="#" class="text-primary hover:text-primary-dark hover:underline font-medium text-sm">
              Vissza a bejelentkezéshez
            </a>
          </div>
        </div>
      </app-auth-layout>
    `
  })
};

// Dark mode (use Storybook's dark mode addon or browser preference)
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Dark mode automatikusan aktiválódik `prefers-color-scheme: dark` esetén.'
      }
    }
  },
  render: () => ({
    template: `
      <div style="color-scheme: dark;">
        <app-auth-layout>
          <div class="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
            <div class="text-center mb-6">
              <h1 class="text-3xl font-bold text-white mb-2">Tablókirály</h1>
              <p class="text-slate-400">Jelentkezz be a folytatáshoz</p>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-200 mb-2">Email cím</label>
                <input
                  type="email"
                  class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-light"
                  placeholder="pelda@email.hu"
                />
              </div>

              <button
                class="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-4 rounded-lg"
              >
                Bejelentkezés
              </button>
            </div>
          </div>
        </app-auth-layout>
      </div>
    `
  })
};

// A11y - Reduced Motion
export const ReducedMotion: Story = {
  parameters: {
    docs: {
      description: {
        story: `
**Reduced Motion támogatás**

\`prefers-reduced-motion: reduce\` média query esetén:
- Gradient animáció leáll
- Orb lebegés leáll
- Statikus megjelenés marad

Teszteléshez a böngésző beállításaiban kapcsold be a "Reduce motion" opciót.
        `
      }
    }
  },
  render: () => ({
    template: `
      <app-auth-layout>
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Reduced Motion Demo</h1>
            <p class="text-gray-600 text-sm">
              A böngésző "Reduce motion" beállításával tesztelhető.
              <br><br>
              macOS: System Preferences → Accessibility → Display → Reduce motion
              <br>
              Windows: Settings → Ease of Access → Display → Show animations
            </p>
          </div>
        </div>
      </app-auth-layout>
    `
  })
};
