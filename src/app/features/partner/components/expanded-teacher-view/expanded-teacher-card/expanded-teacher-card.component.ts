import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedClassTeacher } from '../expanded-teacher-view.types';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';

@Component({
  selector: 'app-expanded-teacher-card',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './expanded-teacher-card.component.html',
  styleUrl: './expanded-teacher-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedTeacherCardComponent {
  readonly ICONS = ICONS;
  private dataService = inject(ExpandedTeacherViewDataService);

  readonly teacher = input.required<ExpandedClassTeacher>();
  readonly isHighlighted = input(false);
  readonly highlightType = input<'exact' | 'similar' | 'missing' | null>(null);

  /** Linked group sorszám badge (1, 2, 3...) — null ha nincs linkedGroup */
  readonly linkedGroupNumber = computed<number | null>(() => {
    const lg = this.teacher().linkedGroup;
    if (!lg) return null;
    return this.dataService.linkedGroupNumbers().get(lg) ?? null;
  });

  readonly hover = output<{ normalizedName: string; personId: number } | null>();
  readonly select = output<number>();
  readonly drop = output<number>();
  readonly removeOverride = output<number>();

  readonly isDragTarget = signal(false);

  /** Fotó hozzárendelés folyamatban erre a kártyára */
  readonly isAssigning = computed(() =>
    this.dataService.assigningPersonIds().has(this.teacher().personId)
  );

  readonly initials = computed(() => {
    const name = this.teacher().name;
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  });

  onMouseEnter(): void {
    const t = this.teacher();
    this.hover.emit({ normalizedName: t.normalizedName, personId: t.personId });
  }

  onMouseLeave(): void {
    this.hover.emit(null);
  }

  onClick(): void {
    this.select.emit(this.teacher().personId);
  }

  onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('application/x-photo-id')) {
      event.preventDefault();
      this.isDragTarget.set(true);
    }
  }

  onDragLeave(): void {
    this.isDragTarget.set(false);
  }

  onDropPhoto(event: DragEvent): void {
    event.preventDefault();
    this.isDragTarget.set(false);
    if (event.dataTransfer?.types.includes('application/x-photo-id')) {
      this.drop.emit(this.teacher().personId);
    }
  }

  onRemoveOverride(event: MouseEvent): void {
    event.stopPropagation();
    this.removeOverride.emit(this.teacher().personId);
  }
}
