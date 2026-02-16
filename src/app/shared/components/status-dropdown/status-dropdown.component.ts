import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, ElementRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../constants/icons.constants';

export interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon: string;
}

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'not_started', label: 'Nincs elkezdve', color: 'gray', icon: ICONS.CIRCLE },
  { value: 'waiting_for_photos', label: 'Képekre várok', color: 'red', icon: ICONS.CAMERA },
  { value: 'sos_waiting_for_photos', label: 'SOS képekre vár', color: 'red', icon: ICONS.ALERT_TRIANGLE },
  { value: 'waiting_for_response', label: 'Válaszra várok', color: 'blue', icon: ICONS.MAIL },
  { value: 'got_response', label: 'Kaptam választ', color: 'green', icon: ICONS.MAIL_CHECK },
  { value: 'needs_forwarding', label: 'Tovább kell küldeni', color: 'amber', icon: ICONS.FORWARD },
  { value: 'needs_call', label: 'Fel kell hívni', color: 'red', icon: ICONS.PHONE },
  { value: 'should_finish', label: 'Be kellene fejeznem', color: 'amber', icon: ICONS.CLOCK },
  { value: 'push_could_be_done', label: 'Nyomni, mert kész lehetne', color: 'amber', icon: ICONS.ARROW_RIGHT },
  { value: 'waiting_for_finalization', label: 'Véglegesítésre várok', color: 'blue', icon: ICONS.FILE_CHECK },
  { value: 'at_teacher_for_finalization', label: 'Osztályfőnöknél', color: 'blue', icon: ICONS.USER_CHECK },
  { value: 'in_print', label: 'Nyomdában', color: 'purple', icon: ICONS.PRINTER },
  { value: 'done', label: 'Kész', color: 'green', icon: ICONS.CHECK },
];

@Component({
  selector: 'app-status-dropdown',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './status-dropdown.component.html',
  styleUrl: './status-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusDropdownComponent {
  readonly currentStatus = input<string>('not_started');
  readonly currentLabel = input<string>('');
  readonly currentColor = input<string>('gray');
  readonly shortLabels = input<boolean>(false);

  readonly statusChange = output<{ value: string; label: string; color: string }>();

  readonly isOpen = signal(false);
  readonly options = STATUS_OPTIONS;

  private readonly el = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly onDocClick = (e: MouseEvent) => {
    if (!this.el.nativeElement.contains(e.target)) {
      this.isOpen.set(false);
    }
  };

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    const open = !this.isOpen();
    this.isOpen.set(open);
    if (open) {
      document.addEventListener('click', this.onDocClick);
    } else {
      document.removeEventListener('click', this.onDocClick);
    }
  }

  selectStatus(option: StatusOption, event: MouseEvent): void {
    event.stopPropagation();
    if (option.value !== this.currentStatus()) {
      this.statusChange.emit({ value: option.value, label: option.label, color: option.color });
    }
    this.isOpen.set(false);
    document.removeEventListener('click', this.onDocClick);
  }

  getStatusIcon(status: string): string {
    return this.options.find(o => o.value === status)?.icon ?? ICONS.CIRCLE;
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', this.onDocClick);
    });
  }
}
