import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit, inject, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { PartnerService } from '../../../services/partner.service';
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

/** Minták amikhez AI javaslatot kérünk (a többihez lokális algo elég) */
const AI_PATTERNS: Set<LayoutPatternType> = new Set(['v-shape', 'inverted-v', 'u-shape', 'inverted-u']);

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
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
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

  /** Fizikai korlát: max hány fér egy sorba */
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

  readonly studentEffectiveMax = computed(() =>
    Math.min(this.studentMaxPerRow(), this.studentPhysicalMax()),
  );

  readonly teacherEffectiveMax = computed(() =>
    Math.min(this.teacherMaxPerRow(), this.teacherPhysicalMax()),
  );

  readonly studentOverflow = computed(() =>
    this.studentMaxPerRow() > this.studentPhysicalMax(),
  );

  readonly teacherOverflow = computed(() =>
    this.teacherMaxPerRow() > this.teacherPhysicalMax(),
  );

  // --- AI javaslat ---

  /** AI-tól kapott soronkénti elemszámok (null = lokális algo) */
  readonly studentAiRows = signal<number[] | null>(null);
  readonly teacherAiRows = signal<number[] | null>(null);
  readonly studentAiLoading = signal(false);
  readonly teacherAiLoading = signal(false);
  readonly studentAiReasoning = signal('');
  readonly teacherAiReasoning = signal('');

  private readonly studentAiTrigger$ = new Subject<void>();
  private readonly teacherAiTrigger$ = new Subject<void>();

  /** Előnézet: AI eredmény ha van, különben lokális */
  readonly studentRows = computed(() =>
    this.studentAiRows() ?? buildRowConfigs(this.studentPattern(), this.studentCount() || 12, this.studentEffectiveMax()),
  );

  readonly teacherRows = computed(() =>
    this.teacherAiRows() ?? buildRowConfigs(this.teacherPattern(), this.teacherCount() || 4, this.teacherEffectiveMax()),
  );

  // --- Arányos SVG előnézet ---

  protected readonly boardW = computed(() => this.boardDimensions()?.boardWidthCm ?? 120);
  protected readonly boardH = computed(() => this.boardDimensions()?.boardHeightCm ?? 80);
  protected readonly margin = computed(() => this.boardDimensions()?.marginCm ?? 2);
  protected readonly studentCellCm = computed(() => this.boardDimensions()?.studentSizeCm ?? 6);
  protected readonly teacherCellCm = computed(() => this.boardDimensions()?.teacherSizeCm ?? 6);
  protected readonly studentCellHCm = computed(() => this.studentCellCm() * 1.5);
  protected readonly teacherCellHCm = computed(() => this.teacherCellCm() * 1.5);

  readonly viewBoxW = computed(() => this.boardW());
  readonly viewBoxH = computed(() => this.boardH());

  readonly teacherGridH = computed(() => {
    const rows = this.teacherRows();
    if (rows.length === 0) return 0;
    return rows.length * this.teacherCellHCm() + (rows.length - 1) * this.gapVCm();
  });

  readonly studentGridH = computed(() => {
    const rows = this.studentRows();
    if (rows.length === 0) return 0;
    return rows.length * this.studentCellHCm() + (rows.length - 1) * this.gapVCm();
  });

  readonly teacherStartY = computed(() => this.margin());

  readonly studentStartY = computed(() =>
    this.boardH() - this.margin() - this.gapVCm() - this.studentGridH(),
  );

  readonly freeZoneTop = computed(() => this.teacherStartY() + this.teacherGridH());
  readonly freeZoneBottom = computed(() => this.studentStartY());
  readonly freeZoneH = computed(() => Math.max(0, this.freeZoneBottom() - this.freeZoneTop()));
  readonly verticalOverflow = computed(() => this.freeZoneH() < 0);

  constructor() {
    // Diák AI trigger — debounce 500ms
    this.studentAiTrigger$.pipe(
      debounceTime(500),
      switchMap(() => {
        const dims = this.boardDimensions();
        const pattern = this.studentPattern();
        const total = this.studentCount() || 12;
        const max = this.studentEffectiveMax();

        if (!AI_PATTERNS.has(pattern) || !dims) {
          this.studentAiRows.set(null);
          this.studentAiLoading.set(false);
          return of(null);
        }

        this.studentAiLoading.set(true);
        return this.partnerService.suggestLayout({
          pattern,
          totalItems: total,
          maxPerRow: max,
          boardWidthCm: dims.boardWidthCm,
          boardHeightCm: dims.boardHeightCm,
          cellSizeCm: dims.studentSizeCm,
          gapHCm: this.gapHCm(),
          marginCm: dims.marginCm,
        }).pipe(
          catchError(() => of(null)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.studentAiLoading.set(false);
      if (res?.success && res.rowConfigs?.length > 0) {
        this.studentAiRows.set(res.rowConfigs);
        this.studentAiReasoning.set(res.reasoning || '');
      } else {
        this.studentAiRows.set(null);
        this.studentAiReasoning.set('');
      }
    });

    // Tanár AI trigger — debounce 500ms
    this.teacherAiTrigger$.pipe(
      debounceTime(500),
      switchMap(() => {
        const dims = this.boardDimensions();
        const pattern = this.teacherPattern();
        const total = this.teacherCount() || 4;
        const max = this.teacherEffectiveMax();

        if (!AI_PATTERNS.has(pattern) || !dims) {
          this.teacherAiRows.set(null);
          this.teacherAiLoading.set(false);
          return of(null);
        }

        this.teacherAiLoading.set(true);
        return this.partnerService.suggestLayout({
          pattern,
          totalItems: total,
          maxPerRow: max,
          boardWidthCm: dims.boardWidthCm,
          boardHeightCm: dims.boardHeightCm,
          cellSizeCm: dims.teacherSizeCm,
          gapHCm: this.gapHCm(),
          marginCm: dims.marginCm,
        }).pipe(
          catchError(() => of(null)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(res => {
      this.teacherAiLoading.set(false);
      if (res?.success && res.rowConfigs?.length > 0) {
        this.teacherAiRows.set(res.rowConfigs);
        this.teacherAiReasoning.set(res.reasoning || '');
      } else {
        this.teacherAiRows.set(null);
        this.teacherAiReasoning.set('');
      }
    });

    // Effect: paraméter-változáskor triggereljük az AI-t
    effect(() => {
      // Read all reactive dependencies
      this.studentPattern();
      this.studentEffectiveMax();
      this.gapHCm();
      this.boardDimensions();
      this.studentCount();
      // Trigger
      this.studentAiTrigger$.next();
    });

    effect(() => {
      this.teacherPattern();
      this.teacherEffectiveMax();
      this.gapHCm();
      this.boardDimensions();
      this.teacherCount();
      this.teacherAiTrigger$.next();
    });
  }

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
      this.studentMaxPerRow.set(this.studentPhysicalMax());
      this.teacherMaxPerRow.set(this.teacherPhysicalMax());
    }
  }

  setStudentPattern(type: LayoutPatternType): void {
    this.studentPattern.set(type);
    this.studentAiRows.set(null); // Reset AI, lokális azonnal mutat
  }

  setTeacherPattern(type: LayoutPatternType): void {
    this.teacherPattern.set(type);
    this.teacherAiRows.set(null);
  }

  setStudentMaxPerRow(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 1 && v <= 30) {
      this.studentMaxPerRow.set(v);
      this.studentAiRows.set(null);
    }
  }

  setTeacherMaxPerRow(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 1 && v <= 30) {
      this.teacherMaxPerRow.set(v);
      this.teacherAiRows.set(null);
    }
  }

  setGapH(event: Event): void {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 0 && v <= 10) {
      this.gapHCm.set(v);
      this.studentAiRows.set(null);
      this.teacherAiRows.set(null);
    }
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
      studentRowConfigs: this.studentAiRows() ?? undefined,
      teacherRowConfigs: this.teacherAiRows() ?? undefined,
    });
  }

  /** Szár sor-e (U/∩ mintánál 2 elem a széleken) */
  isStemRow(rowCols: number, pattern: LayoutPatternType): boolean {
    return rowCols === 2 && (pattern === 'u-shape' || pattern === 'inverted-u');
  }

  getCellX(col: number, rowCols: number, cellW: number, pattern: LayoutPatternType, maxPerRow: number): number {
    const bw = this.boardW();
    const m = this.margin();
    const gapH = this.gapHCm();
    const availW = bw - 2 * m;

    // U/∩ szár sorok: 2 elem a szélekre igazítva (teljes szélességben)
    if (this.isStemRow(rowCols, pattern) && maxPerRow > 2) {
      if (col === 0) return m;
      return m + availW - cellW;
    }

    const rowWidth = rowCols * cellW + (rowCols - 1) * gapH;

    let offsetX = m;
    const align = this.gridAlign();
    if (align === 'center') offsetX = m + (availW - rowWidth) / 2;
    else if (align === 'right') offsetX = m + availW - rowWidth;

    return offsetX + col * (cellW + gapH);
  }

  getTeacherCellY(rowIdx: number): number {
    return this.teacherStartY() + rowIdx * (this.teacherCellHCm() + this.gapVCm());
  }

  getStudentCellY(rowIdx: number): number {
    return this.studentStartY() + rowIdx * (this.studentCellHCm() + this.gapVCm());
  }
}
