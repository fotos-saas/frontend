import { Component, ChangeDetectionStrategy, signal, input, output } from '@angular/core';
import { MissingUserCardComponent } from '../missing-user-card/missing-user-card.component';
import { PokeComposerComponent } from '../poke-composer/poke-composer.component';
import { MissingCategory, MissingUser, PokeCategory } from '../../../core/models/poke.models';

/**
 * Missing Category Component
 *
 * Accordion-szerű kategória komponens a hiányzókhoz.
 */
@Component({
  selector: 'app-missing-category',
  imports: [
    MissingUserCardComponent,
    PokeComposerComponent,
  ],
  templateUrl: './missing-category.component.html',
  styleUrls: ['./missing-category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingCategoryComponent {
  /** Signal-based inputs */
  readonly category = input.required<PokeCategory>();
  readonly data = input.required<MissingCategory | null>();
  readonly emoji = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input.required<string>();

  /** Signal-based outputs */
  readonly pokeSentEvent = output<{
    user: MissingUser;
    category: PokeCategory;
    presetKey?: string;
    customMessage?: string;
  }>();

  /** Nyitva van-e az accordion */
  readonly isExpanded = signal<boolean>(true);

  /** Composer dialógus */
  readonly showComposer = signal<boolean>(false);
  readonly composerUser = signal<MissingUser | null>(null);

  /**
   * Accordion toggle
   */
  toggle(): void {
    this.isExpanded.update(v => !v);
  }

  /**
   * Bökés gomb kattintás
   */
  onPokeClick(user: MissingUser): void {
    this.composerUser.set(user);
    this.showComposer.set(true);
  }

  /**
   * Composer eredmény
   */
  onComposerResult(result: { action: 'send' | 'cancel'; presetKey?: string; customMessage?: string }): void {
    this.showComposer.set(false);

    if (result.action === 'send') {
      const user = this.composerUser();
      if (user) {
        this.pokeSentEvent.emit({
          user,
          category: this.category(),
          presetKey: result.presetKey,
          customMessage: result.customMessage
        });
      }
    }

    this.composerUser.set(null);
  }

  /**
   * TrackBy user id
   */
  trackByUserId(index: number, user: MissingUser): number {
    return user.id;
  }
}
