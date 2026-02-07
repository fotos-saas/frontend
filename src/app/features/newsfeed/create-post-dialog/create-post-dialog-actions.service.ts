import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { NewsfeedService, CreatePostRequest, UpdatePostRequest, NewsfeedPost } from '../../../core/services/newsfeed.service';

export interface SubmitCallbacks {
  onSuccess: (postId: number, action: 'created' | 'updated') => void;
  onError: (message: string) => void;
}

/**
 * CreatePostDialogActionsService - API hivasok a create-post-dialog-hoz.
 *
 * Kezeli a poszt letrehozas es szerkesztes logikajat.
 */
@Injectable({ providedIn: 'root' })
export class CreatePostDialogActionsService {
  private readonly newsfeedService = inject(NewsfeedService);

  /**
   * Uj poszt letrehozasa.
   */
  submitCreate(
    request: CreatePostRequest,
    mediaFiles: File[],
    destroyRef: DestroyRef,
    callbacks: SubmitCallbacks
  ): void {
    const mediaToUpload = mediaFiles.length > 0 ? mediaFiles : undefined;

    this.newsfeedService.createPost(request, mediaToUpload).pipe(
      takeUntilDestroyed(destroyRef)
    ).subscribe({
      next: (post) => callbacks.onSuccess(post.id, 'created'),
      error: (err) => callbacks.onError(err.message || 'Hiba tortent a mentes soran.')
    });
  }

  /**
   * Poszt szerkesztese (torlesekkel + frissitessel).
   */
  submitEdit(
    editPost: NewsfeedPost,
    request: UpdatePostRequest,
    mediaFiles: File[],
    mediaToDelete: number[],
    destroyRef: DestroyRef,
    callbacks: SubmitCallbacks
  ): void {
    const deleteOperations = mediaToDelete.map(mediaId =>
      this.newsfeedService.deleteMedia(mediaId)
    );

    const deleteStream$ = deleteOperations.length > 0
      ? forkJoin(deleteOperations)
      : of([]);

    const newMediaFiles = mediaFiles.length > 0 ? mediaFiles : undefined;

    deleteStream$.pipe(
      switchMap(() => this.newsfeedService.updatePost(editPost.id, request, newMediaFiles)),
      takeUntilDestroyed(destroyRef)
    ).subscribe({
      next: (post) => callbacks.onSuccess(post.id, 'updated'),
      error: (err) => callbacks.onError(err.message || 'Hiba tortent a mentes soran.')
    });
  }
}
