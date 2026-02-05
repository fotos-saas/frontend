import {
  Component,
  input,
  output,
  model,
  ElementRef,
  viewChild,
  ChangeDetectionStrategy,
  signal,
  inject,
  DestroyRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { MentionService, MentionParticipant } from '../../../core/services/mention.service';

/**
 * Mention Input Component
 *
 * Textarea @mention autocomplete funkcióval.
 * A @ karakter beírása után automatikusan feldobja a keresést.
 */
@Component({
  selector: 'app-mention-input',
  imports: [FormsModule],
  templateUrl: './mention-input.component.html',
  styleUrls: ['./mention-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentionInputComponent {
  /** Signal-based inputs */
  readonly placeholder = input<string>('Írd ide a szöveget...');
  readonly disabled = input<boolean>(false);
  readonly rows = input<number>(4);

  /** Two-way binding with model signal */
  readonly value = model<string>('');

  /** Signal-based outputs */
  readonly valueChangeEvent = output<string>();

  /** ViewChild */
  readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  /** Services */
  private readonly mentionService = inject(MentionService);
  private readonly destroyRef = inject(DestroyRef);

  /** Autocomplete állapot */
  readonly isSearching = signal<boolean>(false);
  readonly suggestions = signal<MentionParticipant[]>([]);
  readonly showSuggestions = signal<boolean>(false);
  readonly selectedIndex = signal<number>(0);

  /** Keresési query */
  private searchQuery$ = new Subject<string>();

  /** Mention pozíció a szövegben */
  private mentionStartPos = 0;

  constructor() {
    // Autocomplete setup
    this.mentionService.createAutocomplete(this.searchQuery$).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(results => {
      this.suggestions.set(results);
      this.isSearching.set(false);
      this.showSuggestions.set(results.length > 0);
      this.selectedIndex.set(0);
    });

    this.destroyRef.onDestroy(() => {
      this.searchQuery$.complete();
    });
  }

  /**
   * Input esemény kezelése
   */
  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const newValue = textarea.value;
    this.value.set(newValue);
    this.valueChangeEvent.emit(newValue);

    // @ karakter keresése a kurzor pozíciónál
    const cursorPos = textarea.selectionStart;
    this.checkForMention(newValue, cursorPos);
  }

  /**
   * Billentyű leütés kezelése
   */
  onKeydown(event: KeyboardEvent): void {
    if (!this.showSuggestions()) return;

    const suggestions = this.suggestions();
    const currentIndex = this.selectedIndex();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.set(Math.min(currentIndex + 1, suggestions.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.set(Math.max(currentIndex - 1, 0));
        break;

      case 'Enter':
      case 'Tab':
        if (suggestions.length > 0) {
          event.preventDefault();
          this.selectSuggestion(suggestions[currentIndex]);
        }
        break;

      case 'Escape':
        this.closeSuggestions();
        break;
    }
  }

  /**
   * Suggestion kiválasztása
   */
  selectSuggestion(participant: MentionParticipant): void {
    if (!this.textareaRef()) return;

    const textarea = this.textareaRef()!.nativeElement;
    const text = this.value();
    const cursorPos = textarea.selectionStart;

    // A @ karaktertől a kurzor pozícióig lecseréljük
    const beforeMention = text.substring(0, this.mentionStartPos);
    const afterCursor = text.substring(cursorPos);
    const mentionText = `@${participant.name} `;

    const newValue = beforeMention + mentionText + afterCursor;
    this.value.set(newValue);
    this.valueChangeEvent.emit(newValue);

    // Kurzor pozícionálása a mention után
    setTimeout(() => {
      const newPos = this.mentionStartPos + mentionText.length;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
    });

    this.closeSuggestions();
  }

  /**
   * Suggestion click
   */
  onSuggestionClick(participant: MentionParticipant): void {
    this.selectSuggestion(participant);
  }

  /**
   * Mention ellenőrzése
   */
  private checkForMention(text: string, cursorPos: number): void {
    // Keressük a legközelebbi @ karaktert a kurzor előtt
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex === -1) {
      this.closeSuggestions();
      return;
    }

    // Ellenőrizzük, hogy a @ előtt szóköz vagy sor eleje van-e
    if (lastAtIndex > 0 && !/\s/.test(text[lastAtIndex - 1])) {
      this.closeSuggestions();
      return;
    }

    // Keresési kifejezés (@ utáni rész)
    const query = textBeforeCursor.substring(lastAtIndex + 1);

    // Ha szóköz van a query-ben, már nem keresünk
    if (query.includes(' ')) {
      this.closeSuggestions();
      return;
    }

    // Keresés indítása
    this.mentionStartPos = lastAtIndex;
    this.isSearching.set(true);
    this.searchQuery$.next(query);
  }

  /**
   * Suggestions bezárása
   */
  private closeSuggestions(): void {
    this.showSuggestions.set(false);
    this.suggestions.set([]);
    this.selectedIndex.set(0);
  }

  /**
   * Blur kezelése
   */
  onBlur(): void {
    // Kis késleltetéssel zárjuk be, hogy a click esemény előbb fusson
    setTimeout(() => {
      this.closeSuggestions();
    }, 200);
  }
}
