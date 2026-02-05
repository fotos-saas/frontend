import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ExpandButtonComponent } from '../action-buttons';

/**
 * ExpandableContentComponent
 *
 * Újrahasználható komponens HTML tartalom megjelenítésére,
 * amely összecsukott állapotban gradient fade-del végződik
 * és "Tovább olvasom" gombbal kibontható.
 *
 * Intelligens működés:
 * - Ha a tartalom belefér a collapsedHeight-be, nincs gomb
 * - Ha a tartalom kicsit túlnyúlik (tűréshatáron belül), automatikusan bővít
 * - Ha a tartalom jelentősen hosszabb, collapsed + gomb
 */
@Component({
  selector: 'app-expandable-content',
  standalone: true,
  imports: [SafeHtmlPipe, ExpandButtonComponent],
  templateUrl: './expandable-content.component.html',
  styleUrl: './expandable-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None // innerHTML tartalom stílusozásához
})
export class ExpandableContentComponent implements AfterViewInit {
  /** Opcionális cím */
  readonly title = input<string>('');

  /** HTML tartalom (kötelező) */
  readonly content = input.required<string>();

  /** Összecsukott magasság pixelben */
  readonly collapsedHeight = input<number>(100);

  /** Tűréshatár százalékban - ennyi túllógás még automatikusan bővül */
  readonly tolerancePercent = input<number>(20);

  /** Expand gomb felirat */
  readonly expandLabel = input<string>('Tovább olvasom');

  /** Collapse gomb felirat */
  readonly collapseLabel = input<string>('Kevesebb');

  /** Expanded állapot változás */
  readonly expandedChange = output<boolean>();

  /** Belső állapot */
  readonly isExpanded = signal(false);

  /** Belső tartalom referencia a magasság méréshez */
  readonly innerRef = viewChild.required<ElementRef<HTMLDivElement>>('innerRef');

  /** Valós tartalom magasság */
  private contentHeight = signal<number>(0);

  /** Kell-e expand gomb és fade? */
  readonly needsExpansion = computed(() => {
    const height = this.contentHeight();
    const collapsed = this.collapsedHeight();
    const tolerance = this.tolerancePercent();

    // Tűréshatár: collapsedHeight * (1 + tolerance/100)
    const threshold = collapsed * (1 + tolerance / 100);

    return height > threshold;
  });

  /** Aktuális max-height az animációhoz */
  readonly currentMaxHeight = computed(() => {
    if (this.isExpanded()) {
      return this.contentHeight() || undefined;
    }
    // Collapsed állapotban a collapsedHeight, DE csak ha kell expansion
    return this.needsExpansion() ? this.collapsedHeight() : undefined;
  });

  ngAfterViewInit(): void {
    this.measureContent();
  }

  /**
   * Tartalom magasság mérése
   */
  private measureContent(): void {
    if (this.innerRef()?.nativeElement) {
      const height = this.innerRef().nativeElement.scrollHeight;
      this.contentHeight.set(height);
    }
  }

  /**
   * Expand/Collapse toggle
   */
  toggle(): void {
    const newState = !this.isExpanded();
    this.isExpanded.set(newState);
    this.expandedChange.emit(newState);
  }

  /**
   * Csak kinyitás (collapsed állapotból)
   */
  expand(): void {
    if (!this.isExpanded() && this.needsExpansion()) {
      this.isExpanded.set(true);
      this.expandedChange.emit(true);
    }
  }

  /**
   * Body kattintás - collapsed állapotban kinyit
   */
  onBodyClick(): void {
    if (!this.isExpanded() && this.needsExpansion()) {
      this.expand();
    }
  }
}
