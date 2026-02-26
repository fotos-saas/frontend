import { Component, ChangeDetectionStrategy, inject, input, output, computed, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { LayoutDesignerStateService } from '../../layout-designer-state.service';
import { LayoutDesignerSortService } from '../../layout-designer-sort.service';

/**
 * Fix bal oldali sidebar a Layout Designerben.
 * Rendezési szekció + Minta készítés szekció.
 */
@Component({
  selector: 'app-layout-sort-panel',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './layout-sort-panel.component.html',
  styleUrl: './layout-sort-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutSortPanelComponent {
  readonly state = inject(LayoutDesignerStateService);
  readonly sortService = inject(LayoutDesignerSortService);
  protected readonly ICONS = ICONS;

  readonly openCustomDialog = output<void>();
  readonly openActions = output<void>();
  readonly openExtraNamesDialog = output<void>();
  readonly generateSample = output<void>();
  readonly generateFinal = output<void>();
  readonly cycleFinalMode = output<void>();
  readonly openProject = output<void>();
  readonly openWorkDir = output<void>();

  /** Minta generálás állapotok (a szülő kezeli) */
  readonly generatingSample = input(false);
  readonly generatingFinal = input(false);
  readonly finalMode = input<'flat' | 'small_tablo' | 'both'>('both');

  readonly finalModeLabel = computed(() => {
    switch (this.finalMode()) {
      case 'flat': return 'F';
      case 'small_tablo': return 'K';
      default: return 'F+K';
    }
  });

  readonly finalModeTooltip = computed(() => {
    switch (this.finalMode()) {
      case 'flat': return 'Csak flat — kattints a kistablóhoz';
      case 'small_tablo': return 'Csak kistabló — kattints a mind a kettőhöz';
      default: return 'Flat + Kistabló — kattints a csak flat-hoz';
    }
  });
  readonly sampleLargeSize = input(false);
  readonly sampleLargeSizeChange = output<boolean>();
  readonly sampleWatermarkColor = input<'white' | 'black'>('white');
  readonly watermarkColorChange = output<'white' | 'black'>();
  readonly sampleWatermarkOpacity = input(0.15);
  readonly opacityChange = output<void>();
  readonly opacityPercent = computed(() => Math.round(this.sampleWatermarkOpacity() * 100));
  readonly sampleSuccess = input<string | null>(null);
  readonly sampleError = input<string | null>(null);

  /** Extra nevek input a szülőtől (projekt adat) */
  readonly extraNames = input<{ students: string; teachers: string } | null>(null);
  readonly insertingExtraNames = input(false);

  /** Van-e bármilyen extra név (szekció megjelenítéséhez) */
  readonly hasAnyExtraNames = computed(() => {
    const en = this.extraNames();
    return !!en && (!!en.students || !!en.teachers);
  });

  /** Extra nevek beillesztés output */
  readonly insertExtraNames = output<{ includeStudents: boolean; includeTeachers: boolean }>();

  /** Státusz üzenetek */
  readonly extraNamesSuccess = input<string | null>(null);
  readonly extraNamesError = input<string | null>(null);

  onInsertExtraNames(): void {
    this.insertExtraNames.emit({
      includeStudents: !!this.extraNames()?.students,
      includeTeachers: !!this.extraNames()?.teachers,
    });
  }
}
