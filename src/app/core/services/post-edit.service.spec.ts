import { TestBed } from '@angular/core/testing';
import { PostEditService } from './post-edit.service';

describe('PostEditService', () => {
  let service: PostEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startEdit', () => {
    it('beállítja az editingPostId-t és editingContent-et', () => {
      service.startEdit(42, 'Hello World');
      expect(service.editingPostId()).toBe(42);
      expect(service.editingContent()).toBe('Hello World');
    });
  });

  describe('cancelEdit', () => {
    it('visszaállítja az állapotot', () => {
      service.startEdit(42, 'Hello');
      service.cancelEdit();
      expect(service.editingPostId()).toBeNull();
      expect(service.editingContent()).toBe('');
    });
  });

  describe('finishEdit', () => {
    it('nullázza az állapotot és a submitting-et', () => {
      service.startEdit(42, 'Hello');
      service.setSubmitting(true);
      service.finishEdit();
      expect(service.editingPostId()).toBeNull();
      expect(service.editingContent()).toBe('');
      expect(service.isSubmitting()).toBe(false);
    });
  });

  describe('updateContent', () => {
    it('frissíti az editingContent-et', () => {
      service.updateContent('Új tartalom');
      expect(service.editingContent()).toBe('Új tartalom');
    });
  });

  describe('setSubmitting', () => {
    it('beállítja az isSubmitting értéket', () => {
      service.setSubmitting(true);
      expect(service.isSubmitting()).toBe(true);
      service.setSubmitting(false);
      expect(service.isSubmitting()).toBe(false);
    });
  });

  describe('isEditing', () => {
    it('true ha az adott postot szerkesztjük', () => {
      service.startEdit(42, 'text');
      expect(service.isEditing(42)).toBe(true);
      expect(service.isEditing(99)).toBe(false);
    });
  });

  describe('getRemainingEditTime', () => {
    it('perceket ad vissza ha van hátra', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = service.getRemainingEditTime(fiveMinAgo);
      expect(result).toContain('perc');
    });

    it('üres stringet ad vissza ha lejárt', () => {
      const twentyMinAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
      expect(service.getRemainingEditTime(twentyMinAgo)).toBe('');
    });

    it('másodpercet ad vissza ha kevesebb mint 1 perc', () => {
      const almostExpired = new Date(Date.now() - 14 * 60 * 1000 - 30 * 1000).toISOString();
      const result = service.getRemainingEditTime(almostExpired);
      expect(result).toContain('másodperc');
    });
  });

  describe('isEditTimeExpired', () => {
    it('false ha még nem járt le', () => {
      const now = new Date().toISOString();
      expect(service.isEditTimeExpired(now)).toBe(false);
    });

    it('true ha lejárt (16 perc)', () => {
      const sixteenMinAgo = new Date(Date.now() - 16 * 60 * 1000).toISOString();
      expect(service.isEditTimeExpired(sixteenMinAgo)).toBe(true);
    });
  });

  describe('EDIT_TIME_LIMIT_MS', () => {
    it('15 perc milliszekundumban', () => {
      expect(PostEditService.EDIT_TIME_LIMIT_MS).toBe(15 * 60 * 1000);
    });
  });
});
