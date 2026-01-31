import { DialogStateHelper } from '../../../shared/helpers/dialog-state.helper';

/**
 * Dialogs State
 *
 * Kezeli a különböző dialógusok állapotát.
 */
export class DialogsState {
  /** Info dialog állapota */
  readonly infoDialog = new DialogStateHelper();

  /** Confirm dialog állapota (véglegesítéshez) */
  readonly confirmDialog = new DialogStateHelper();

  /** Deselect confirm dialog állapota (kijelölés törléséhez) */
  readonly deselectConfirmDialog = new DialogStateHelper();

  /**
   * Reset minden dialógus
   */
  reset(): void {
    this.infoDialog.reset();
    this.confirmDialog.reset();
    this.deselectConfirmDialog.reset();
  }
}
