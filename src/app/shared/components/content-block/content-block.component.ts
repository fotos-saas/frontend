import {
  ChangeDetectionStrategy,
  Component,
  input,
  output
} from '@angular/core';
import { ExpandableContentComponent } from '../expandable-content';

/**
 * ContentBlockComponent
 *
 * Újrahasználható komponens címmel és expandable tartalommal.
 * Használható newsfeed card-oknál, fórum bejegyzéseknél, stb.
 *
 * @example
 * <app-content-block
 *   [title]="post.title"
 *   [content]="post.content"
 *   [collapsedHeight]="100"
 * />
 */
@Component({
  selector: 'app-content-block',
  standalone: true,
  imports: [ExpandableContentComponent],
  templateUrl: './content-block.component.html',
  styleUrl: './content-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContentBlockComponent {
  /** Cím (kötelező) */
  readonly title = input.required<string>();

  /** HTML tartalom (opcionális) */
  readonly content = input<string | null>(null);

  /** Összecsukott magasság pixelben */
  readonly collapsedHeight = input<number>(100);

  /** Tűréshatár százalékban */
  readonly tolerancePercent = input<number>(20);

  /** Expand gomb felirat */
  readonly expandLabel = input<string>('Tovább olvasom');

  /** Collapse gomb felirat */
  readonly collapseLabel = input<string>('Kevesebb');

  /** Expanded állapot változás */
  readonly expandedChange = output<boolean>();

  onExpandedChange(expanded: boolean): void {
    this.expandedChange.emit(expanded);
  }
}
