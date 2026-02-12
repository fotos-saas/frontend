import { Component, OnInit, ChangeDetectionStrategy, inject, DestroyRef, viewChild, ElementRef, viewChildren, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { take } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { NewsfeedPost, NewsfeedMedia, NewsfeedComment } from '../../../core/services/newsfeed.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { NewsfeedCardComponent } from '../newsfeed-card/newsfeed-card.component';
import { CreatePostDialogComponent, CreatePostResult } from '../create-post-dialog/create-post-dialog.component';
import { MediaLightboxComponent } from '../../../shared/components/media-lightbox';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { NewsfeedListStateService } from './newsfeed-list-state.service';

/**
 * Newsfeed List Component
 *
 * Hírfolyam lista:
 * - Kitűzött posztok felül
 * - Típus szerinti szűrés (bejelentés/esemény)
 * - Új poszt létrehozás (mindenki)
 */
@Component({
  selector: 'app-newsfeed-list',
  imports: [
    RouterModule,
    GuestNameDialogComponent,
    NewsfeedCardComponent,
    CreatePostDialogComponent,
    MediaLightboxComponent,
    ConfirmDialogComponent,
  ],
  providers: [NewsfeedListStateService],
  templateUrl: './newsfeed-list.component.html',
  styleUrls: ['./newsfeed-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewsfeedListComponent implements OnInit, AfterViewInit {
  /** Filter container és gombok a sliding indicator-hoz */
  readonly filterContainer = viewChild<ElementRef<HTMLElement>>('filterContainer');
  readonly filterButtons = viewChildren<ElementRef<HTMLButtonElement>>('filterBtn');

  private readonly state = inject(NewsfeedListStateService);
  private readonly destroyRef = inject(DestroyRef);

  // ==================== SIGNAL DELEGÁLÁSOK (template-hez) ====================

  readonly posts = this.state.posts;
  readonly isLoading = this.state.isLoading;
  readonly errorMessage = this.state.errorMessage;
  readonly showGuestNameDialog = this.state.showGuestNameDialog;
  readonly isGuestRegistering = this.state.isGuestRegistering;
  readonly guestError = this.state.guestError;
  readonly showCreateDialog = this.state.showCreateDialog;
  readonly editingPost = this.state.editingPost;
  readonly activeFilter = this.state.activeFilter;
  readonly lightboxOpen = this.state.lightboxOpen;
  readonly lightboxMedia = this.state.lightboxMedia;
  readonly lightboxIndex = this.state.lightboxIndex;
  readonly showDeleteDialog = this.state.showDeleteDialog;
  readonly isDeleting = this.state.isDeleting;
  readonly showCommentDeleteDialog = this.state.showCommentDeleteDialog;
  readonly pinnedPosts = this.state.pinnedPosts;
  readonly regularPosts = this.state.regularPosts;

  // ==================== ÉLETCIKLUS ====================

  ngOnInit(): void {
    this.state.init();
  }

  ngAfterViewInit(): void {
    timer(0).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.updateFilterIndicator());
  }

  // ==================== SZŰRÉS + INDICATOR ====================

  onFilterChange(filter: 'all' | 'announcement' | 'event'): void {
    this.state.applyFilter(filter);

    timer(0).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.updateFilterIndicator());
  }

  loadPosts(): void {
    this.state.loadPosts();
  }

  // ==================== POSZT MŰVELETEK ====================

  createPost(): void {
    this.state.openCreateDialog();
  }

  onCardEditClick(post: NewsfeedPost): void {
    this.state.openEditDialog(post);
  }

  onCreatePostResult(result: CreatePostResult): void {
    this.state.handleCreatePostResult(result);
  }

  onReaction(post: NewsfeedPost, reaction: ReactionEmoji): void {
    this.state.handleReaction(post, reaction);
  }

  onTogglePin(post: NewsfeedPost): void {
    this.state.togglePin(post);
  }

  onPostDeleteClick(post: NewsfeedPost): void {
    this.state.openDeleteDialog(post);
  }

  onDeleteDialogResult(result: ConfirmDialogResult): void {
    this.state.handleDeleteDialogResult(result);
  }

  // ==================== KOMMENTEK ====================

  getCommentsForPost(postId: number): NewsfeedComment[] {
    return this.state.getCommentsForPost(postId);
  }

  isCommentsLoading(postId: number): boolean {
    return this.state.isCommentsLoading(postId);
  }

  onToggleComments(post: NewsfeedPost): void {
    this.state.toggleComments(post);
  }

  onSubmitComment(post: NewsfeedPost, data: { content: string; parentId?: number }): void {
    this.state.submitComment(post, data);
  }

  onDeleteComment(post: NewsfeedPost, comment: NewsfeedComment): void {
    this.state.openCommentDeleteDialog(post, comment);
  }

  onCommentDeleteDialogResult(result: ConfirmDialogResult): void {
    this.state.handleCommentDeleteResult(result);
  }

  onCommentReaction(post: NewsfeedPost, comment: NewsfeedComment, reaction: ReactionEmoji): void {
    this.state.handleCommentReaction(post, comment, reaction);
  }

  // ==================== VENDÉG ====================

  onGuestNameResult(result: GuestNameResult): void {
    this.state.handleGuestNameResult(result);
  }

  // ==================== LIGHTBOX ====================

  onCardLightbox(event: { media: NewsfeedMedia[], index: number }): void {
    this.state.openLightbox(event);
  }

  closeLightbox(): void {
    this.state.closeLightbox();
  }

  onLightboxNavigate(index: number): void {
    this.state.navigateLightbox(index);
  }

  // ==================== KAPCSOLATTARTÓ ====================

  isContact(): boolean {
    return this.state.isContact();
  }

  // ==================== PRIVÁT ====================

  private updateFilterIndicator(): void {
    if (!this.filterContainer() || this.filterButtons().length === 0) return;

    const container = this.filterContainer()!.nativeElement;
    const buttons = this.filterButtons();
    const filterMap: Record<string, number> = { all: 0, announcement: 1, event: 2 };
    const activeIndex = filterMap[this.activeFilter()];
    const activeBtn = buttons[activeIndex]?.nativeElement;

    if (activeBtn) {
      const left = activeBtn.offsetLeft;
      const width = activeBtn.offsetWidth;
      container.style.setProperty('--indicator-left', `${left}px`);
      container.style.setProperty('--indicator-width', `${width}px`);
    }
  }
}
