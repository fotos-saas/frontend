// Action Button komponensek exportjai

export type ButtonDisplay = 'icon-text' | 'icon-only' | 'text-only';

// ============================================================================
// Generikus IconButton - új komponensekhez ezt használd!
// ============================================================================
export { IconButtonComponent, type ButtonVariant } from './icon-button.component';

// ============================================================================
// Legacy komponensek - visszafelé kompatibilitásért megtartva
// Új kódban az IconButtonComponent-et használd helyettük!
//
// Megfeleltetés:
// - DeleteButtonComponent → <app-icon-button icon="trash-2" variant="danger" />
// - EditButtonComponent → <app-icon-button icon="pencil" />
// - ReplyButtonComponent → <app-icon-button icon="reply" variant="primary" />
// - CommentButtonComponent → <app-icon-button icon="message-circle" />
// - AddButtonComponent → <app-icon-button icon="plus" variant="primary" />
// - QrButtonComponent → <app-icon-button icon="qr-code" />
// ============================================================================
export { BackButtonComponent } from './back-button.component';
export { DeleteButtonComponent } from './delete-button.component';
export { EditButtonComponent } from './edit-button.component';
export { ReplyButtonComponent } from './reply-button.component';
export { CommentButtonComponent } from './comment-button.component';
export { ExpandButtonComponent } from './expand-button.component';
export { ReplyToggleButtonComponent } from './reply-toggle-button.component';
export { QrButtonComponent } from './qr-button.component';
export { AddButtonComponent } from './add-button.component';
