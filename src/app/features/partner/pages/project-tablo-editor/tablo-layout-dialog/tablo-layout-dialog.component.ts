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

/** Tábla fizikai méretek (cm) az arányos előnézethez */
export interface BoardDimensions {
  boardWidthCm: number;
  boardHeightCm: number;
  marginCm: number;
  studentSizeCm: number;
  teacherSizeCm: number;
}

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

  /** Bemenetek */
  initialConfig = input<TabloLayoutConfig | null>(null);
  studentCount = input(0);
  teacherCount = input(0);
  boardDimensions = input<BoardDimensions | null>(null);

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

  /** Fizikai korlát: max hány fér egy sorba a tábla szélességéből */
  readonly studentPhysicalMax = computed(() => {
    const dims = this.boardDimensions();
    if (!dims) return 99;
    const availW = dims.boardWidthCm - 2 * dims.marginCm;
    return Math.max(1, Math.floor((availW + this.gapHCm()) / (dims.studentSizeCm + this.gapHCm())));
  });

  readonly teacherPhysicalMax = computed(() => {
    const dims = this.boardDimensions();
    if (!dims) return 99;
    const availW = dims.boardWidthCm - 2 * dims.marginCm;
    return Math.max(1, Math.floor((availW + this.gapHCm()) / (dims.teacherSizeCm + this.gapHCm())));
  });

  /** Effektív max/sor = min(user beállítás, fizikai korlát) */
  readonly studentEffectiveMax = computed(() =>
    Math.min(this.studentMaxPerRow(), this.studentPhysicalMax()),
  );

  readonly teacherEffectiveMax = computed(() =>
    Math.min(this.teacherMaxPerRow(), this.teacherPhysicalMax()),
  );

  /** Figyelmeztetés ha a user beállítás > fizikai korlát */
  readonly studentOverflow = computed(() =>
    this.studentMaxPerRow() > this.studentPhysicalMax(),
  );

  readonly teacherOverflow = computed(() =>
    this.teacherMaxPerRow() > this.teacherPhysicalMax(),
  );

  /** Előnézet: soronkénti elemszám — effektív max-szal */
  readonly studentRows = computed(() =>
    buildRowConfigs(this.studentPattern(), this.studentCount() || 12, this.studentEffectiveMax()),
  );

  readonly teacherRows = computed(() =>
    buildRowConfigs(this.teacherPattern(), this.teacherCount() || 4, this.teacherEffectiveMax()),
  );

  // --- Arányos SVG előnézet ---

  /** Belső arányok cm-ben (protected — template-ből is olvasható) */
  protected readonly boardW = computed(() => this.boardDimensions()?.boardWidthCm ?? 120);
  protected readonly boardH = computed(() => this.boardDimensions()?.boardHeightCm ?? 80);
  protected readonly margin = computed(() => this.boardDimensions()?.marginCm ?? 2);
  protected readonly studentCellCm = computed(() => this.boardDimensions()?.studentSizeCm ?? 6);
  protected readonly teacherCellCm = computed(() => this.boardDimensions()?.teacherSizeCm ?? 6);

  /** Cella aspect ratio (portré ~1:1.5) */
  protected readonly studentCellHCm = computed(() => this.studentCellCm() * 1.5);
  protected readonly teacherCellHCm = computed(() => this.teacherCellCm() * 1.5);

  /** SVG viewBox: a tábla arányaiban */
  readonly viewBoxW = computed(() => this.boardW());
  readonly viewBoxH = computed(() => this.boardH());

  /** Tanár grid magasság cm-ben */
  readonly teacherGridH = computed(() => {
    const rows = this.teacherRows();
    if (rows.length === 0) return 0;
    return rows.length * this.teacherCellHCm() + (rows.length - 1) * this.gapVCm();
  });

  /** Diák grid magasság cm-ben */
  readonly studentGridH = computed(() => {
    const rows = this.studentRows();
    if (rows.length === 0) return 0;
    return rows.length * this.studentCellHCm() + (rows.length - 1) * this.gapVCm();
  });

  /** Tanár Y kezdőpont (margótól felülről) */
  readonly teacherStartY = computed(() => this.margin());

  /** Diák Y kezdőpont (alulról felfelé, mint a JSX-ben) */
  readonly studentStartY = computed(() =>
    this.boardH() - this.margin() - this.gapVCm() - this.studentGridH(),
  );

  /** Szabad zóna (feliratok) */
  readonly freeZoneTop = computed(() => this.teacherStartY() + this.teacherGridH());
  readonly freeZoneBottom = computed(() => this.studentStartY());
  readonly freeZoneH = computed(() => Math.max(0, this.freeZoneBottom() - this.freeZoneTop()));

  /** Kilógás figyelmeztetés: diákok + tanárok + gap nem fér a táblára */
  readonly verticalOverflow = computed(() => this.freeZoneH() < 0);

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
    } else {
      // Alapértelmezett: a fizikai korlát (ami ténylegesen kifér)
      this.studentMaxPerRow.set(this.studentPhysicalMax());
      this.teacherMaxPerRow.set(this.teacherPhysicalMax());
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
    if (!isNaN(v) && v >= 1 && v <= 30) this.studentMaxPerRow.set(v);
  }

  setTeacherMaxPerRow(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 1 && v <= 30) this.teacherMaxPerRow.set(v);
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
      studentMaxPerRow: this.studentEffectiveMax(),
      teacherMaxPerRow: this.teacherEffectiveMax(),
      gapHCm: this.gapHCm(),
      gapVCm: this.gapVCm(),
      gridAlign: this.gridAlign(),
    });
  }

  /** SVG cella X pozíció (cm, arányos a tábla szélességéhez) */
  getCellX(col: number, rowCols: number, cellW: number): number {
    const bw = this.boardW();
    const m = this.margin();
    const gapH = this.gapHCm();
    const availW = bw - 2 * m;
    const rowWidth = rowCols * cellW + (rowCols - 1) * gapH;

    let offsetX = m;
    const align = this.gridAlign();
    if (align === 'center') offsetX = m + (availW - rowWidth) / 2;
    else if (align === 'right') offsetX = m + availW - rowWidth;

    return offsetX + col * (cellW + gapH);
  }

  /** SVG cella Y pozíció a tanár csoportban */
  getTeacherCellY(rowIdx: number): number {
    return this.teacherStartY() + rowIdx * (this.teacherCellHCm() + this.gapVCm());
  }

  /** SVG cella Y pozíció a diák csoportban */
  getStudentCellY(rowIdx: number): number {
    return this.studentStartY() + rowIdx * (this.studentCellHCm() + this.gapVCm());
  }
}
