import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  input,
  output,
  inject,
} from '@angular/core';
import { A11yModule, FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { createBackdropHandler } from '../../utils/dialog.util';

export interface ConfirmDialogResult {
  action: 'confirm' | 'cancel';
}

/**
 * Újrafelhasználható megerősítő dialógus
 *
 * Törlések és veszélyes műveletek megerősítésére.
 * A11y: Focus trap implementálva a CDK-val.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [A11yModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent implements AfterViewInit, OnDestroy {
  private readonly focusTrapFactory = inject(FocusTrapFactory);

  /** Signal-based inputs */
  readonly title = input<string>('Megerősítés');
  readonly message = input<string>('Biztosan folytatod?');
  readonly confirmText = input<string>('Törlés');
  readonly cancelText = input<string>('Mégse');
  readonly confirmType = input<'danger' | 'warning' | 'primary'>('danger');
  readonly isSubmitting = input<boolean>(false);
  readonly showCancel = input<boolean>(true);

  /** Signal-based output */
  readonly resultEvent = output<ConfirmDialogResult>();

  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLElement>;

  private focusTrap: FocusTrap | null = null;
  private previousActiveElement: HTMLElement | null = null;

  /** Backdrop handler - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  readonly backdropHandler = createBackdropHandler(() => this.onCancel());

  ngAfterViewInit(): void {
    // Előző fókuszált elem mentése
    this.previousActiveElement = document.activeElement as HTMLElement;

    // Focus trap létrehozása
    if (this.dialogContent?.nativeElement) {
      this.focusTrap = this.focusTrapFactory.create(this.dialogContent.nativeElement);
      this.focusTrap.focusInitialElementWhenReady();
    }
  }

  ngOnDestroy(): void {
    // Focus trap felszabadítása
    this.focusTrap?.destroy();

    // Fókusz visszaállítása az előző elemre
    if (this.previousActiveElement?.focus) {
      setTimeout(() => {
        this.previousActiveElement?.focus();
      }, 0);
    }
  }

  /**
   * ESC billentyű kezelése - dialog bezárása
   */
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: Event): void {
    if (!(event instanceof KeyboardEvent)) return;

    if (event.key === 'Escape' || event.key === 'Esc') {
      // Csak akkor kezeljük, ha a dialogContent létezik (azaz a dialog nyitva van)
      if (this.dialogContent?.nativeElement) {
        this.onCancel();
      }
    }
  }

  onCancel(): void {
    this.resultEvent.emit({ action: 'cancel' });
  }

  onConfirm(): void {
    this.resultEvent.emit({ action: 'confirm' });
  }
}
