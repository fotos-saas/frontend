import { Component, OnInit, ChangeDetectionStrategy, DestroyRef, inject, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiscussionPost } from '../../../core/services/forum.service';
import { LightboxService } from '../../../core/services/lightbox.service';
import { GuestNameDialogComponent, GuestNameResult } from '../../../shared/components/guest-name-dialog/guest-name-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ReplyFormComponent } from '../reply-form/reply-form.component';
import { ReactionEmoji } from '../../../shared/components/reaction-picker/reaction-picker.component';
import { MediaLightboxComponent } from '../../../shared/components/media-lightbox';
import { ForumPostComponent } from '../../../shared/components/forum-post';
import { PostEditFormComponent, PostEditSaveData } from '../../../shared/components/post-edit-form';
import { ContentBlockComponent } from '../../../shared/components/content-block';
import { PostMetaBarComponent } from '../../../shared/components/post-meta-bar';
import { PostHeaderBarComponent } from '../../../shared/components/post-header-bar';
import { CreateDiscussionDialogComponent, CreateDiscussionResult } from '../create-discussion-dialog/create-discussion-dialog.component';
import { ForumDetailStateService } from './forum-detail-state.service';

/**
 * Forum Detail Component
 *
 * Beszélgetés részletes nézete:
 * - Téma fejléc (cím, állapot)
 * - Hozzászólások listája (threaded)
 * - Válasz form
 */
@Component({
    selector: 'app-forum-detail',
    imports: [
        RouterModule,
        FormsModule,
        GuestNameDialogComponent,
        ConfirmDialogComponent,
        ReplyFormComponent,
        MediaLightboxComponent,
        ForumPostComponent,
        PostEditFormComponent,
        ContentBlockComponent,
        PostMetaBarComponent,
        PostHeaderBarComponent,
        CreateDiscussionDialogComponent,
    ],
    providers: [ForumDetailStateService],
    templateUrl: './forum-detail.component.html',
    styleUrls: ['./forum-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForumDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly state = inject(ForumDetailStateService);
  readonly lightboxService = inject(LightboxService);

  // Expose service signals directly for template
  readonly postEditService = this.state.postEditService;
  readonly discussion = this.state.discussion;
  readonly isLoading = this.state.isLoading;
  readonly errorMessage = this.state.errorMessage;
  readonly successMessage = this.state.successMessage;
  readonly isSubmitting = this.state.isSubmitting;
  readonly replyingToId = this.state.replyingToId;
  readonly showGuestNameDialog = this.state.showGuestNameDialog;
  readonly isGuestRegistering = this.state.isGuestRegistering;
  readonly guestError = this.state.guestError;
  readonly showDeleteDialog = this.state.showDeleteDialog;
  readonly postToDelete = this.state.postToDelete;
  readonly isDeleting = this.state.isDeleting;
  readonly showTopicEditDialog = this.state.showTopicEditDialog;
  readonly topicDescription = this.state.topicDescription;
  readonly topicComments = this.state.topicComments;
  readonly hasComments = this.state.hasComments;
  readonly isTopicAuthor = this.state.isTopicAuthor;
  readonly editData = this.state.editData;
  readonly headerBadges = this.state.headerBadges;
  readonly canReply = this.state.canReply;
  readonly hasFullAccess = this.state.hasFullAccess;

  /** Fő reply form referencia (reset-hez) */
  private readonly mainReplyForm = viewChild<ReplyFormComponent>('mainReplyForm');

  constructor() {
    this.lightboxService.registerCleanup(this.destroyRef);
  }

  ngOnInit(): void {
    this.state.checkGuestStatus();

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.state.loadDiscussion(slug);
    }
  }

  // ==================== NAVIGATION ====================

  goBack(): void {
    this.router.navigate(['/forum']);
  }

  scrollToComments(): void {
    const postsElement = document.querySelector('.forum-detail__posts');
    if (postsElement) {
      postsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==================== REPLY ====================

  submitReply(data: { content: string; parentId?: number; media?: File[] }): void {
    this.state.submitReply(data, () => this.mainReplyForm()?.reset());
  }

  startReply(postId: number): void {
    this.state.replyingToId.set(postId);
  }

  cancelReply(): void {
    this.state.replyingToId.set(null);
  }

  // ==================== REACTIONS ====================

  onReaction(post: DiscussionPost, reaction: ReactionEmoji): void {
    this.state.onReaction(post, reaction);
  }

  // ==================== TOPIC EDIT/DELETE ====================

  onEditTopic(): void {
    this.state.onEditTopic();
  }

  onTopicEditResult(result: CreateDiscussionResult): void {
    this.state.onTopicEditResult(result);
  }

  onDeleteTopic(): void {
    const description = this.state.topicDescription();
    if (description) {
      this.state.onDeletePost(description);
    }
  }

  // ==================== DELETE ====================

  onDeletePost(post: DiscussionPost): void {
    this.state.onDeletePost(post);
  }

  onDeleteDialogResult(result: ConfirmDialogResult): void {
    this.state.onDeleteDialogResult(result);
  }

  // ==================== EDIT ====================

  startEdit(post: DiscussionPost): void {
    this.state.startEdit(post);
  }

  cancelEdit(): void {
    this.state.cancelEdit();
  }

  saveEditContent(post: DiscussionPost, data: PostEditSaveData): void {
    this.state.saveEditContent(post, data);
  }

  // ==================== GUEST ====================

  onGuestNameResult(result: GuestNameResult): void {
    this.state.onGuestNameResult(result);
  }

  // ==================== LIGHTBOX ====================

  openLightbox(media: DiscussionPost['media'], index: number): void {
    if (media) {
      this.lightboxService.open(media, index);
    }
  }

  closeLightbox(): void {
    this.lightboxService.close();
  }

  onLightboxNavigate(index: number): void {
    this.lightboxService.navigateTo(index);
  }

  // ==================== HELPERS ====================

  trackByPost(index: number, post: DiscussionPost): number {
    return post.id;
  }

  formatTimeAgo(dateStr: string): string {
    return this.state.formatTimeAgo(dateStr);
  }

  getRemainingEditTime(post: DiscussionPost): string {
    return this.state.getRemainingEditTime(post);
  }

  isEditTimeExpired(post: DiscussionPost): boolean {
    return this.state.isEditTimeExpired(post);
  }
}
