import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * Auth Layout - Floating Mesh Aurora háttér
 *
 * CSS-only, GPU-accelerated, Safari kompatibilis animált háttér
 * az auth oldalakhoz (login, forgot-password, register, stb.)
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="auth-layout">
      <!-- Animated background -->
      <div class="auth-layout__bg" aria-hidden="true">
        <div class="auth-layout__dots"></div>
        <div class="auth-layout__gradient"></div>
        <div class="auth-layout__orb auth-layout__orb--1"></div>
        <div class="auth-layout__orb auth-layout__orb--2"></div>
        <div class="auth-layout__orb auth-layout__orb--3"></div>
        <div class="auth-layout__grain"></div>
      </div>

      <!-- Content -->
      <div class="auth-layout__content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    // ============================================
    // CSS VARIABLES
    // ============================================
    :host {
      // Light mode colors - csak kék/cyan árnyalatok
      --aurora-1: #60a5fa; // kék
      --aurora-2: #38bdf8; // cyan
      --aurora-3: #3b82f6; // sötétebb kék
      --aurora-4: #22d3ee; // világos cyan
      --bg-base: #eff6ff;  // light blue bg

      display: block;
      min-height: 100vh;
    }

    // Dark mode colors - csak kék/cyan árnyalatok
    @media (prefers-color-scheme: dark) {
      :host {
        --aurora-1: #1e3a5f; // sötét kék
        --aurora-2: #164e63; // sötét cyan
        --aurora-3: #1e40af; // mély kék
        --aurora-4: #0e7490; // teal
        --bg-base: #0f172a;
      }
    }

    // ============================================
    // KEYFRAMES
    // ============================================

    // Mesh gradient mozgás (60s - nagyon lassú, nem terheli a GPU-t)
    @keyframes meshMove {
      0%, 100% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
    }

    // ============================================
    // LAYOUT
    // ============================================
    .auth-layout {
      position: relative;
      min-height: 100vh;
      contain: layout style paint;

      // Background layer
      &__bg {
        position: fixed;
        inset: 0;
        overflow: hidden;
        z-index: 0;
        background: var(--bg-base);
      }

      // Static dot grid pattern (no animation - prevents flickering)
      &__dots {
        position: absolute;
        inset: 0;
        opacity: 0.08;

        // Dot grid pattern - radial-gradient
        background-image: radial-gradient(
          circle at center,
          var(--aurora-1) 1.5px,
          transparent 1.5px
        );
        background-size: 30px 30px;
      }

      // Base mesh gradient (slowed down to 60s to avoid flicker)
      &__gradient {
        position: absolute;
        inset: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(
          45deg,
          var(--aurora-1) 0%,
          var(--aurora-4) 25%,
          var(--aurora-2) 50%,
          var(--aurora-3) 75%,
          var(--aurora-1) 100%
        );
        background-size: 400% 400%;
        animation: meshMove 60s ease-in-out infinite;
        opacity: 0.15;
      }

      // Static floating orbs (no animation - blur(80px) + animation = Safari flicker)
      &__orb {
        position: absolute;
        border-radius: 50%;
        -webkit-filter: blur(80px);
        filter: blur(80px);
        opacity: 0.5;

        &--1 {
          width: 400px;
          height: 400px;
          top: -100px;
          left: -100px;
          background: var(--aurora-1);
        }

        &--2 {
          width: 350px;
          height: 350px;
          bottom: -50px;
          right: -100px;
          background: var(--aurora-2);
        }

        &--3 {
          width: 300px;
          height: 300px;
          top: 50%;
          left: 60%;
          background: var(--aurora-3);
        }
      }

      // Grain texture overlay
      &__grain {
        position: absolute;
        inset: 0;
        opacity: 0.03;
        mix-blend-mode: overlay;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      }

      // Content layer
      &__content {
        position: relative;
        z-index: 1;
        min-height: 100vh;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 1rem;
        padding-top: 4rem;
      }
    }

    // ============================================
    // REDUCED MOTION (A11y)
    // ============================================
    @media (prefers-reduced-motion: reduce) {
      .auth-layout {
        &__gradient {
          animation: none;
          background-position: 50% 50%;
        }
      }
    }

    // ============================================
    // MOBILE OPTIMIZATIONS
    // ============================================
    @media (max-width: 640px) {
      .auth-layout {
        &__content {
          padding-top: 2rem;
        }
      }
    }
  `]
})
export class AuthLayoutComponent {}
