import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { LayoutPatternType, TabloLayoutConfig } from '../layout-designer/layout-designer.types';
import { buildRowConfigs } from '../layout-designer/layout-pattern.utils';

interface PatternOption {
  type: LayoutPatternType;
  label: string;
  icon: string;
}

const PATTERN_OPTIONS: PatternOption[] = [
  { type: 'grid', label: 'Rács', icon: '▦' },
  { type: 'u-shape', label: 'U-alak', icon: '∪' },
  { type: 'inverted-u', label: 'Fordított U', icon: '∩' },
  { type: 'v-shape', label: 'V-alak', icon: 'V' },
  { type: 'inverted-v', label: 'Fordított V', icon: '∧' },
  { type: 'two-sides', label: 'Két oldal', icon: '‖' },
];

@Component({
  selector: 'app-tablo-layout-dialog',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, DialogWrapperComponent],
  templateUrl: './tablo-layout-dialog.component.html',
  styleUrl: './tablo-layout-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabloLayoutDialogComponent implements OnInit {
  protected readonly ICONS = ICONS;
  protected readonly PATTERN_OPTIONS = PATTERN_OPTIONS;

  /** Kezdeti konfig (ha van) */
  initialConfig = input<TabloLayoutConfig | null>(null);
  studentCount = input(0);
  teacherCount = input(0);

  /** Output */
  apply = output<TabloLayoutConfig>();
  close = output<void>();

  /** Form signal-ök */
  studentPattern = signal<LayoutPatternType>('grid');
  teacherPattern = signal<LayoutPatternType>('grid');
  studentMaxPerRow = signal(5);
  teacherMaxPerRow = signal(5);
  gapHCm = signal(2);
  gapVCm = signal(3);
  gridAlign = signal<'left' | 'center' | 'right'>('center');

  /** Előnézet: diák sorok */
  readonly studentRows = computed(() =>
    buildRowConfigs(this.studentPattern(), this.studentCount() || 12, this.studentMaxPerRow()),
  );

  /** Előnézet: tanár sorok */
  readonly teacherRows = computed(() =>
    buildRowConfigs(this.teacherPattern(), this.teacherCount() || 4, this.teacherMaxPerRow()),
  );

  /** SVG viewBox méretezés */
  readonly previewMaxCols = computed(() => {
    const sMax = Math.max(...this.studentRows(), 0);
    const tMax = Math.max(...this.teacherRows(), 0);
    return Math.max(sMax, tMax, 1);
  });

  readonly previewTotalRows = computed(() =>
    this.teacherRows().length + this.studentRows().length + 1,
  );

  ngOnInit(): void {
    const cfg = this.initialConfig();
    if (cfg) {
      this.studentPattern.set(cfg.studentPattern);
      this.teacherPattern.set(cfg.teacherPattern);
      this.studentMaxPerRow.set(cfg.studentMaxPerRow);
      this.teacherMaxPerRow.set(cfg.teacherMaxPerRow);
      this.gapHCm.set(cfg.gapHCm);
      this.gapVCm.set(cfg.gapVCm);
      this.gridAlign.set(cfg.gridAlign);
    }
  }

  setStudentPattern(type: LayoutPatternType): void {
    this.studentPattern.set(type);
  }

  setTeacherPattern(type: LayoutPatternType): void {
    this.teacherPattern.set(type);
  }

  setStudentMaxPerRow(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 1 && v <= 20) this.studentMaxPerRow.set(v);
  }

  setTeacherMaxPerRow(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 1 && v <= 20) this.teacherMaxPerRow.set(v);
  }

  setGapH(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 0 && v <= 10) this.gapHCm.set(v);
  }

  setGapV(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 0 && v <= 10) this.gapVCm.set(v);
  }

  setGridAlign(align: 'left' | 'center' | 'right'): void {
    this.gridAlign.set(align);
  }

  onApply(): void {
    this.apply.emit({
      studentPattern: this.studentPattern(),
      teacherPattern: this.teacherPattern(),
      studentMaxPerRow: this.studentMaxPerRow(),
      teacherMaxPerRow: this.teacherMaxPerRow(),
      gapHCm: this.gapHCm(),
      gapVCm: this.gapVCm(),
      gridAlign: this.gridAlign(),
    });
  }

  /** SVG előnézet segéd: cella X pozíció az igazítás alapján */
  getCellX(col: number, rowCols: number): number {
    const maxCols = this.previewMaxCols();
    const cellSize = 1;
    const gap = 0.3;
    const rowWidth = rowCols * cellSize + (rowCols - 1) * gap;
    const totalWidth = maxCols * cellSize + (maxCols - 1) * gap;

    let offsetX = 0;
    const align = this.gridAlign();
    if (align === 'center') offsetX = (totalWidth - rowWidth) / 2;
    else if (align === 'right') offsetX = totalWidth - rowWidth;

    return offsetX + col * (cellSize + gap);
  }
}
