import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../shared/constants/icons.constants';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div class="text-center">
        <!-- 404 nagy szám -->
        <h1 class="text-[150px] md:text-[200px] font-black text-white/10 leading-none select-none">
          404
        </h1>

        <!-- Tartalom -->
        <div class="-mt-16 md:-mt-20">
          <div class="w-20 h-20 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <lucide-icon [name]="ICONS.SEARCH" [size]="40" class="text-white/60" />
          </div>

          <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">
            Az oldal nem található
          </h2>

          <p class="text-white/60 mb-8 max-w-md mx-auto">
            A keresett oldal nem létezik, vagy áthelyezésre került.
            Ellenőrizd az URL-t, vagy térj vissza a kezdőlapra.
          </p>

          <a
            routerLink="/"
            class="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold py-3 px-6 rounded-xl hover:bg-white/90 transition-all hover:scale-105"
          >
            <lucide-icon [name]="ICONS.HOME" [size]="18" />
            Vissza a kezdőlapra
          </a>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {
  readonly ICONS = ICONS;
}
