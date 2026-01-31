import { describe, it, expect, beforeEach } from 'vitest';
import { DialogStateHelper, createDialogState, createDialogs } from './dialog-state.helper';

describe('DialogStateHelper', () => {
  let helper: DialogStateHelper;

  beforeEach(() => {
    helper = new DialogStateHelper();
  });

  describe('initial state', () => {
    it('should have isOpen as false', () => {
      expect(helper.isOpen()).toBe(false);
    });

    it('should have isSubmitting as false', () => {
      expect(helper.isSubmitting()).toBe(false);
    });

    it('should have error as null', () => {
      expect(helper.error()).toBeNull();
    });
  });

  describe('open', () => {
    it('should set isOpen to true', () => {
      helper.open();
      expect(helper.isOpen()).toBe(true);
    });

    it('should clear error', () => {
      helper.setError('Previous error');
      helper.open();
      expect(helper.error()).toBeNull();
    });

    it('should reset isSubmitting to false', () => {
      helper.startSubmit();
      helper.open();
      expect(helper.isSubmitting()).toBe(false);
    });
  });

  describe('close', () => {
    it('should set isOpen to false', () => {
      helper.open();
      helper.close();
      expect(helper.isOpen()).toBe(false);
    });

    it('should reset isSubmitting to false', () => {
      helper.startSubmit();
      helper.close();
      expect(helper.isSubmitting()).toBe(false);
    });

    it('should clear error', () => {
      helper.setError('Some error');
      helper.close();
      expect(helper.error()).toBeNull();
    });
  });

  describe('startSubmit', () => {
    it('should set isSubmitting to true', () => {
      helper.startSubmit();
      expect(helper.isSubmitting()).toBe(true);
    });

    it('should clear error', () => {
      helper.setError('Previous error');
      helper.startSubmit();
      expect(helper.error()).toBeNull();
    });
  });

  describe('submitSuccess', () => {
    it('should set isSubmitting to false', () => {
      helper.startSubmit();
      helper.submitSuccess();
      expect(helper.isSubmitting()).toBe(false);
    });

    it('should set isOpen to false', () => {
      helper.open();
      helper.submitSuccess();
      expect(helper.isOpen()).toBe(false);
    });

    it('should clear error', () => {
      helper.setError('Some error');
      helper.submitSuccess();
      expect(helper.error()).toBeNull();
    });
  });

  describe('submitError', () => {
    it('should set isSubmitting to false', () => {
      helper.startSubmit();
      helper.submitError('Error message');
      expect(helper.isSubmitting()).toBe(false);
    });

    it('should set error message', () => {
      helper.submitError('Error message');
      expect(helper.error()).toBe('Error message');
    });

    it('should keep dialog open', () => {
      helper.open();
      helper.submitError('Error message');
      expect(helper.isOpen()).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      helper.setError('Test error');
      expect(helper.error()).toBe('Test error');
    });

    it('should accept null to clear error', () => {
      helper.setError('Test error');
      helper.setError(null);
      expect(helper.error()).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should set error to null', () => {
      helper.setError('Test error');
      helper.clearError();
      expect(helper.error()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      helper.open();
      helper.startSubmit();
      helper.setError('Some error');

      helper.reset();

      expect(helper.isOpen()).toBe(false);
      expect(helper.isSubmitting()).toBe(false);
      expect(helper.error()).toBeNull();
    });
  });
});

describe('createDialogState', () => {
  it('should create a dialog state with signals', () => {
    const state = createDialogState();
    expect(state.isOpen).toBeDefined();
    expect(state.isSubmitting).toBeDefined();
    expect(state.error).toBeDefined();
  });

  it('should have correct initial values', () => {
    const state = createDialogState();
    expect(state.isOpen()).toBe(false);
    expect(state.isSubmitting()).toBe(false);
    expect(state.error()).toBeNull();
  });
});

describe('createDialogs', () => {
  it('should create multiple dialog helpers', () => {
    const dialogs = createDialogs(['guest', 'create', 'classSize'] as const);
    expect(dialogs.guest).toBeInstanceOf(DialogStateHelper);
    expect(dialogs.create).toBeInstanceOf(DialogStateHelper);
    expect(dialogs.classSize).toBeInstanceOf(DialogStateHelper);
  });

  it('should create independent helpers', () => {
    const dialogs = createDialogs(['a', 'b'] as const);
    dialogs.a.open();
    expect(dialogs.a.isOpen()).toBe(true);
    expect(dialogs.b.isOpen()).toBe(false);
  });
});
