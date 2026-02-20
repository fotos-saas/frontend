import {
  Component, input, output, ChangeDetectionStrategy,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { BatchImportRow } from '../../../models/booking.models';

@Component({
  selector: 'app-csv-preview-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="table-wrapper">
      <table class="csv-table">
        <thead>
          <tr>
            <th class="th-select">
              <input type="checkbox" [checked]="allSelected()" (change)="toggleAll()" />
            </th>
            <th class="th-num">#</th>
            <th>Osztaly</th>
            <th>Letszam</th>
            <th>Kapcsolattarto</th>
            <th>Email</th>
            <th>Datum</th>
            <th>Idopont</th>
            <th>Statusz</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.row_number; let i = $index) {
            <tr [class.row-valid]="row.status === 'valid'"
                [class.row-warning]="row.status === 'warning'"
                [class.row-error]="row.status === 'error'">
              <td>
                <input type="checkbox"
                       [checked]="row.status !== 'error'"
                       [disabled]="row.status === 'error'"
                       (change)="toggleRow(i)" />
              </td>
              <td class="cell-num">{{ row.row_number }}</td>
              <td>{{ row.data.class_name }}</td>
              <td>{{ row.data.student_count }}</td>
              <td>{{ row.data.contact_name }}</td>
              <td class="cell-email">{{ row.data.contact_email }}</td>
              <td>{{ row.data.date }}</td>
              <td>{{ row.data.start_time }}</td>
              <td>
                <div class="status-cell">
                  @switch (row.status) {
                    @case ('valid') {
                      <span class="badge badge-valid">
                        <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="14" /> Ervenyes
                      </span>
                    }
                    @case ('warning') {
                      <span class="badge badge-warning">
                        <lucide-icon [name]="ICONS.ALERT_TRIANGLE" [size]="14" /> Figyelmeztetes
                      </span>
                    }
                    @case ('error') {
                      <span class="badge badge-error">
                        <lucide-icon [name]="ICONS.X_CIRCLE" [size]="14" /> Hibas
                      </span>
                    }
                  }
                </div>

                @if (row.warnings.length > 0) {
                  @for (w of row.warnings; track w) {
                    <div class="row-msg row-msg-warn">{{ w }}</div>
                  }
                }
                @if (row.errors.length > 0) {
                  @for (e of row.errors; track e) {
                    <div class="row-msg row-msg-error">{{ e }}</div>
                  }
                }
                @if (row.suggestion) {
                  <div class="row-msg row-msg-suggest">
                    <lucide-icon [name]="ICONS.SPARKLES" [size]="12" />
                    Javasolt idopont: {{ row.suggestion.start_time }} - {{ row.suggestion.end_time }}
                  </div>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="9" class="empty-cell">Nincs megjelenitendo adat.</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .table-wrapper { overflow-x: auto; border-radius: 10px; border: 1px solid #e2e8f0; }
    .csv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .csv-table th {
      background: #f8fafc; padding: 10px 12px; text-align: left;
      font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
    }
    .csv-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .th-select, .th-num { width: 40px; }
    .cell-num { color: #94a3b8; font-weight: 600; }
    .cell-email { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .row-valid { background: #f0fdf4; }
    .row-warning { background: #fffbeb; }
    .row-error { background: #fef2f2; opacity: 0.7; }
    .status-cell { display: flex; align-items: center; }
    .badge {
      display: inline-flex; align-items: center; padding: 3px 8px;
      border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .badge lucide-icon { margin-right: 4px; }
    .badge-valid { background: #dcfce7; color: #16a34a; }
    .badge-warning { background: #fef3c7; color: #d97706; }
    .badge-error { background: #fee2e2; color: #dc2626; }
    .row-msg { font-size: 11px; margin-top: 4px; padding: 2px 0; line-height: 1.3; }
    .row-msg-warn { color: #d97706; }
    .row-msg-error { color: #dc2626; }
    .row-msg-suggest {
      color: #7c3aed; display: flex; align-items: center;
    }
    .row-msg-suggest lucide-icon { margin-right: 4px; }
    .empty-cell { text-align: center; color: #94a3b8; padding: 24px !important; }
    input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #7c3aed; }
    @media (prefers-reduced-motion: reduce) {
      * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  `],
})
export class CsvPreviewTableComponent {
  readonly rows = input.required<BatchImportRow[]>();
  readonly rowsChanged = output<BatchImportRow[]>();
  readonly ICONS = ICONS;

  allSelected(): boolean {
    const allRows = this.rows();
    const selectable = allRows.filter(r => r.status !== 'error');
    return selectable.length > 0 && selectable.every(r => r.status !== 'error');
  }

  toggleAll(): void {
    const current = this.rows();
    const allChecked = this.allSelected();
    const updated = current.map(r => {
      if (r.status === 'error') return r;
      return { ...r, status: allChecked ? ('error' as const) : (r.errors.length > 0 ? 'error' as const : r.warnings.length > 0 ? 'warning' as const : 'valid' as const) };
    });
    this.rowsChanged.emit(updated);
  }

  toggleRow(index: number): void {
    const current = [...this.rows()];
    const row = current[index];
    if (row.status === 'error') {
      // Hibas sor visszaallitasa figyelmeztetes/ervenyes-re
      current[index] = { ...row, status: row.warnings.length > 0 ? 'warning' : 'valid' };
    } else {
      // Sor kizarasa
      current[index] = { ...row, status: 'error' };
    }
    this.rowsChanged.emit(current);
  }
}
