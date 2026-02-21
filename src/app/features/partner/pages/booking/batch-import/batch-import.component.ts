import {
  Component, signal, computed, inject, ChangeDetectionStrategy, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PartnerBookingService } from '../../../services/partner-booking.service';
import { CsvPreviewTableComponent } from './csv-preview-table.component';
import { BatchCalendarPreviewComponent } from './batch-calendar-preview.component';
import {
  SessionType, BatchImportRow, BatchImportParseResponse,
  BatchImportExecuteRow, Booking,
} from '../../../models/booking.models';

type ImportStep = 'upload' | 'preview' | 'calendar' | 'done';

@Component({
  selector: 'app-batch-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, CsvPreviewTableComponent, BatchCalendarPreviewComponent],
  template: `
    <div class="batch-import page-card page-card--narrow">
      <div class="page-header">
        <h1><lucide-icon [name]="ICONS.FILE_SPREADSHEET" [size]="24" /> Csoportos import</h1>
        <p class="page-desc">Foglalasok importalasa CSV fajlbol.</p>
      </div>
      <div class="step-bar">
        @for (s of stepLabels; track s.key; let i = $index) {
          <div class="step-item" [class.active]="stepIndex() >= i" [class.current]="step() === s.key">
            <div class="step-num">{{ i + 1 }}</div>
            <span class="step-label">{{ s.label }}</span>
          </div>
          @if (i < stepLabels.length - 1) { <div class="step-line" [class.active]="stepIndex() > i"></div> }
        }
      </div>
      <div class="step-content">
        @switch (step()) {
          @case ('upload') {
            <div class="form-group">
              <label>Foglalasi tipus *</label>
              <select class="form-input" [(ngModel)]="selectedTypeId">
                <option [ngValue]="0" disabled>Valasszon tipust...</option>
                @for (t of sessionTypes(); track t.id) {
                  <option [ngValue]="t.id">{{ t.name }} ({{ t.duration_minutes }} perc)</option>
                }
              </select>
            </div>
            <div class="upload-zone" [class.drag-over]="dragOver()"
                 (dragover)="onDragOver($event)" (dragleave)="dragOver.set(false)"
                 (drop)="onDrop($event)" (click)="fileInput.click()">
              <input #fileInput type="file" accept=".csv" (change)="onFileSelect($event)" hidden />
              <lucide-icon [name]="ICONS.UPLOAD" [size]="32" />
              <p class="upload-main">Huzza ide a CSV fajlt, vagy kattintson</p>
              <p class="upload-sub">Tamogatott formatum: .csv</p>
            </div>
            @if (selectedFile()) {
              <div class="file-info">
                <lucide-icon [name]="ICONS.FILE" [size]="16" />
                <span>{{ selectedFile()!.name }}</span>
                <button class="remove-file" (click)="selectedFile.set(null)"><lucide-icon [name]="ICONS.X" [size]="14" /></button>
              </div>
            }
            <div class="action-row">
              <button class="btn-secondary" (click)="downloadTemplate()">
                <lucide-icon [name]="ICONS.DOWNLOAD" [size]="16" /> Minta letoltese
              </button>
              <button class="btn-primary" [disabled]="!canParse()" (click)="parseFile()">
                @if (parsing()) { <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" /> }
                @else { <lucide-icon [name]="ICONS.CHECK" [size]="16" /> }
                Ellenorzes
              </button>
            </div>
          }
          @case ('preview') {
            <div class="summary-bar">
              <span class="sum-item sum-total">Osszes: {{ parseSummary()?.total }}</span>
              <span class="sum-item sum-valid">Ervenyes: {{ parseSummary()?.valid }}</span>
              <span class="sum-item sum-warn">Figyelmeztetes: {{ parseSummary()?.warnings }}</span>
              <span class="sum-item sum-error">Hibas: {{ parseSummary()?.errors }}</span>
            </div>
            <app-csv-preview-table [rows]="rows()" (rowsChanged)="rows.set($event)" />
            <div class="action-row">
              <button class="btn-secondary" (click)="step.set('upload')"><lucide-icon [name]="ICONS.ARROW_LEFT" [size]="16" /> Vissza</button>
              <button class="btn-primary" (click)="step.set('calendar')" [disabled]="acceptedCount() === 0">
                <lucide-icon [name]="ICONS.CALENDAR" [size]="16" /> Naptar elonezet ({{ acceptedCount() }})
              </button>
            </div>
          }
          @case ('calendar') {
            <app-batch-calendar-preview [rows]="acceptedRows()" [existingBookings]="existingBookings()" />
            <div class="action-row">
              <button class="btn-secondary" (click)="step.set('preview')"><lucide-icon [name]="ICONS.ARROW_LEFT" [size]="16" /> Vissza</button>
              <button class="btn-primary" (click)="executeImport()" [disabled]="executing()">
                @if (executing()) { <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" /> }
                @else { <lucide-icon [name]="ICONS.CHECK" [size]="16" /> }
                Importalas ({{ acceptedCount() }} foglalas)
              </button>
            </div>
          }
          @case ('done') {
            <div class="done-state">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="48" class="icon-green" />
              <h2>Importalas kesz!</h2>
              <div class="done-stats">
                <div class="done-stat done-success"><span class="stat-num">{{ result().created }}</span><span class="stat-label">letrehozva</span></div>
                @if (result().failed > 0) {
                  <div class="done-stat done-fail"><span class="stat-num">{{ result().failed }}</span><span class="stat-label">sikertelen</span></div>
                }
              </div>
              <button class="btn-primary" (click)="reset()"><lucide-icon [name]="ICONS.PLUS" [size]="16" /> Uj import</button>
            </div>
          }
        }
      </div>
      @if (error()) {
        <div class="error-box"><lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="18" /><span>{{ error() }}</span></div>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    .page-header h1 { display: flex; align-items: center; font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-header h1 lucide-icon { margin-right: 10px; color: #7c3aed; }
    .page-desc { color: #64748b; font-size: 14px; margin: 0; }
    .step-bar { display: flex; align-items: center; margin-bottom: 28px; }
    .step-item { display: flex; align-items: center; flex-shrink: 0; }
    .step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; background: #e2e8f0; color: #94a3b8; transition: all 0.2s; }
    .step-item.active .step-num { background: #7c3aed; color: #fff; }
    .step-item.current .step-num { box-shadow: 0 0 0 4px rgba(124,58,237,0.15); }
    .step-label { font-size: 13px; color: #94a3b8; margin-left: 6px; }
    .step-item.active .step-label { color: #475569; font-weight: 600; }
    .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 8px; transition: background 0.2s; }
    .step-line.active { background: #7c3aed; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; }
    .form-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; background: #fff; }
    .form-input:focus { outline: none; border-color: #7c3aed; }
    .upload-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px 24px; text-align: center; cursor: pointer; transition: all 0.2s; color: #94a3b8; }
    .upload-zone:hover, .upload-zone.drag-over { border-color: #7c3aed; background: #faf5ff; }
    .upload-main { font-size: 15px; color: #475569; margin: 12px 0 4px; }
    .upload-sub { font-size: 13px; margin: 0; }
    .file-info { display: flex; align-items: center; padding: 10px 12px; border-radius: 8px; background: #f0fdf4; margin-top: 12px; font-size: 14px; color: #16a34a; }
    .file-info lucide-icon { margin-right: 8px; }
    .file-info span { flex: 1; }
    .remove-file { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 2px; }
    .remove-file:hover { color: #dc2626; }
    .action-row { display: flex; justify-content: space-between; margin-top: 20px; }
    .btn-primary, .btn-secondary { display: inline-flex; align-items: center; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; }
    .btn-primary lucide-icon, .btn-secondary lucide-icon { margin-right: 6px; }
    .btn-primary { background: #7c3aed; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #6d28d9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary { background: #f1f5f9; color: #475569; }
    .btn-secondary:hover { background: #e2e8f0; }
    .summary-bar { display: flex; flex-wrap: wrap; padding: 12px 16px; border-radius: 10px; background: #f8fafc; margin-bottom: 16px; margin-left: -12px; }
    .sum-item { font-size: 13px; font-weight: 600; margin-left: 12px; }
    .sum-valid { color: #16a34a; } .sum-warn { color: #d97706; } .sum-error { color: #dc2626; } .sum-total { color: #475569; }
    .done-state { text-align: center; padding: 24px 0; }
    .icon-green { color: #16a34a; margin-bottom: 16px; }
    .done-state h2 { font-size: 20px; font-weight: 700; color: #1e293b; margin: 0 0 20px; }
    .done-stats { display: flex; justify-content: center; margin-bottom: 24px; margin-left: -16px; }
    .done-stat { text-align: center; margin-left: 16px; }
    .stat-num { display: block; font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 13px; color: #64748b; }
    .done-success .stat-num { color: #16a34a; } .done-fail .stat-num { color: #dc2626; }
    .error-box { display: flex; align-items: center; padding: 12px 16px; border-radius: 8px; background: #fef2f2; color: #dc2626; font-size: 14px; margin-top: 16px; }
    .error-box lucide-icon { margin-right: 8px; flex-shrink: 0; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media (max-width: 600px) { .step-label { display: none; } }
    @media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `],
})
export class BatchImportComponent {
  private readonly service = inject(PartnerBookingService);
  private readonly destroyRef = inject(DestroyRef);
  readonly ICONS = ICONS;

  readonly stepLabels = [
    { key: 'upload' as const, label: 'Feltoltes' },
    { key: 'preview' as const, label: 'Elonezet' },
    { key: 'calendar' as const, label: 'Naptar' },
    { key: 'done' as const, label: 'Kesz' },
  ];

  readonly step = signal<ImportStep>('upload');
  readonly stepIndex = computed(() => this.stepLabels.findIndex(s => s.key === this.step()));
  readonly sessionTypes = signal<SessionType[]>([]);
  selectedTypeId = 0;
  readonly selectedFile = signal<File | null>(null);
  readonly dragOver = signal(false);
  readonly parsing = signal(false);
  readonly executing = signal(false);
  readonly error = signal('');
  readonly rows = signal<BatchImportRow[]>([]);
  readonly parseSummary = signal<BatchImportParseResponse['summary'] | null>(null);
  readonly existingBookings = signal<Booking[]>([]);
  readonly result = signal({ created: 0, failed: 0 });

  readonly canParse = computed(() => this.selectedTypeId > 0 && this.selectedFile() !== null && !this.parsing());
  readonly acceptedRows = computed(() => this.rows().filter(r => r.status !== 'error'));
  readonly acceptedCount = computed(() => this.acceptedRows().length);

  constructor() { this.loadSessionTypes(); }

  private loadSessionTypes(): void {
    this.service.getSessionTypes().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res: any) => this.sessionTypes.set(res.data?.session_types ?? res.data ?? []));
  }

  onDragOver(e: DragEvent): void { e.preventDefault(); this.dragOver.set(true); }

  onDrop(e: DragEvent): void {
    e.preventDefault(); this.dragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file && file.name.endsWith('.csv')) { this.selectedFile.set(file); }
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) { this.selectedFile.set(input.files[0]); }
    input.value = '';
  }

  downloadTemplate(): void {
    this.service.downloadBatchTemplate().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'foglalas-import-minta.csv'; a.click();
        URL.revokeObjectURL(url);
      });
  }

  parseFile(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.parsing.set(true); this.error.set('');
    this.service.parseBatchImport(file, this.selectedTypeId).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.rows.set(res.data.rows); this.parseSummary.set(res.data.summary); this.parsing.set(false); this.step.set('preview'); },
        error: () => { this.parsing.set(false); this.error.set('Hiba a fajl feldolgozasa kozben.'); },
      });
  }

  executeImport(): void {
    this.executing.set(true); this.error.set('');
    const execRows: BatchImportExecuteRow[] = this.acceptedRows().map(r => ({
      row_number: r.row_number, data: r.data, accepted: true,
      use_suggestion: !!r.suggestion, suggestion: r.suggestion ?? undefined,
    }));
    this.service.executeBatchImport(execRows, this.selectedTypeId).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.result.set(res.data); this.executing.set(false); this.step.set('done'); },
        error: () => { this.executing.set(false); this.error.set('Hiba az importalas kozben.'); },
      });
  }

  reset(): void {
    this.step.set('upload'); this.selectedFile.set(null); this.rows.set([]);
    this.parseSummary.set(null); this.error.set(''); this.selectedTypeId = 0;
  }
}
