import { Injectable } from '@angular/core';

export interface DiscussionFormErrors {
  title?: string;
  content?: string;
}

export interface DiscussionFormData {
  title: string;
  content: string;
  contentTextLength: number;
  useRichEditor: boolean;
}

/**
 * DiscussionFormValidatorService - Validacios logika a create-discussion-dialog-hoz.
 */
@Injectable({ providedIn: 'root' })
export class DiscussionFormValidatorService {

  /**
   * Teljes validacio futtatasa.
   */
  validate(data: DiscussionFormData): DiscussionFormErrors {
    const errors: DiscussionFormErrors = {};

    const titleError = this.validateTitle(data.title);
    if (titleError) {
      errors.title = titleError;
      return errors;
    }

    const contentError = data.useRichEditor
      ? this.validateRichContent(data.contentTextLength)
      : this.validatePlainContent(data.content);

    if (contentError) {
      errors.content = contentError;
    }

    return errors;
  }

  /**
   * Van-e hiba.
   */
  hasErrors(errors: DiscussionFormErrors): boolean {
    return !!(errors.title || errors.content);
  }

  /**
   * Form validitasa (quick check).
   */
  isFormValid(title: string, contentTextLength: number, content: string, useRichEditor: boolean): boolean {
    const titleValid = title.trim().length >= 3;
    if (useRichEditor) {
      return titleValid && contentTextLength >= 10;
    }
    return titleValid && content.trim().length >= 10;
  }

  private validateTitle(title: string): string | null {
    const trimmed = title.trim();

    if (!trimmed) return 'A cim megadasa kotelezo.';
    if (trimmed.length < 3) return 'A cim legalabb 3 karakter legyen.';
    if (trimmed.length > 255) return 'A cim maximum 255 karakter lehet.';

    return null;
  }

  private validateRichContent(textLength: number): string | null {
    if (textLength === 0) return 'A tartalom megadasa kotelezo.';
    if (textLength < 10) return 'A tartalom legalabb 10 karakter legyen.';
    if (textLength > 10000) return 'A tartalom maximum 10000 karakter lehet.';

    return null;
  }

  private validatePlainContent(content: string): string | null {
    const trimmed = content.trim();

    if (!trimmed) return 'A tartalom megadasa kotelezo.';
    if (trimmed.length < 10) return 'A tartalom legalabb 10 karakter legyen.';
    if (trimmed.length > 10000) return 'A tartalom maximum 10000 karakter lehet.';

    return null;
  }
}
