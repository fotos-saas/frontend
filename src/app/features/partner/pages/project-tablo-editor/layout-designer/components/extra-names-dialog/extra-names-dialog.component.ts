import { Component, ChangeDetectionStrategy, input, output, signal, computed, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({
  selector: 'app-extra-names-dialog',
  standalone: true,
  imports: [LucideAngularModule, FormsModule],
  templateUrl: './extra-names-dialog.component.html',
  styleUrls: ['./extra-names-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtraNamesDialogComponent implements OnInit {
  protected readonly ICONS = ICONS;

  readonly extraNames = input.required<{ students: string; teachers: string }>();
  readonly close = output<void>();
  readonly insert = output<{
    extraNames: { students: string; teachers: string };
    includeStudents: boolean;
    includeTeachers: boolean;
  }>();

  readonly teachers = signal('');
  readonly students = signal('');
  readonly includeStudents = signal(true);
  readonly includeTeachers = signal(true);
  readonly copied = signal<'teachers' | 'students' | null>(null);

  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly isStudentsInline = computed(() => !this.students().includes('\n'));
  readonly isTeachersInline = computed(() => !this.teachers().includes('\n'));

  readonly hasStudents = computed(() => !!this.students().trim());
  readonly hasTeachers = computed(() => !!this.teachers().trim());

  ngOnInit(): void {
    const en = this.extraNames();
    this.students.set(en.students || '');
    this.teachers.set(en.teachers || '');
  }

  sortAbc(field: 'students' | 'teachers'): void {
    const text = field === 'students' ? this.students() : this.teachers();
    const sep = text.includes('\n') ? '\n' : ', ';
    const names = text.split(sep).map(n => n.trim()).filter(Boolean);
    const sorted = names.sort((a, b) => a.localeCompare(b, 'hu'));
    const result = sorted.join(sep);
    if (field === 'students') this.students.set(result);
    else this.teachers.set(result);
  }

  setFormat(field: 'students' | 'teachers', inline: boolean): void {
    const text = field === 'students' ? this.students() : this.teachers();
    let result: string;
    if (inline) {
      result = text.split('\n').map(n => n.trim()).filter(Boolean).join(', ');
    } else {
      result = text.split(',').map(n => n.trim()).filter(Boolean).join('\n');
    }
    if (field === 'students') this.students.set(result);
    else this.teachers.set(result);
  }

  copy(field: 'students' | 'teachers'): void {
    const text = field === 'students' ? this.students() : this.teachers();
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.copied.set(field);
    setTimeout(() => this.copied.set(null), 1500);
  }

  onInsert(): void {
    this.insert.emit({
      extraNames: { students: this.students(), teachers: this.teachers() },
      includeStudents: this.includeStudents(),
      includeTeachers: this.includeTeachers(),
    });
  }
}
