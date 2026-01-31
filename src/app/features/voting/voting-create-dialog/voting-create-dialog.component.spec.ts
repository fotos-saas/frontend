import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { VotingCreateDialogComponent, VotingCreateResult } from './voting-create-dialog.component';

describe('VotingCreateDialogComponent', () => {
  let component: VotingCreateDialogComponent;
  let fixture: ComponentFixture<VotingCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingCreateDialogComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(VotingCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have empty title', () => {
      expect(component.title).toBe('');
    });

    it('should have empty description', () => {
      expect(component.description).toBe('');
    });

    it('should have 2 empty options', () => {
      expect(component.options.length).toBe(2);
      expect(component.options[0]).toBe('');
      expect(component.options[1]).toBe('');
    });

    it('should have custom type by default', () => {
      expect(component.type).toBe('custom');
    });

    it('should not be multiple choice by default', () => {
      expect(component.isMultipleChoice).toBe(false);
    });

    it('should not show results before vote by default', () => {
      expect(component.showResultsBeforeVote).toBe(false);
    });
  });

  describe('addOption', () => {
    it('should add an empty option', () => {
      component.addOption();
      expect(component.options.length).toBe(3);
      expect(component.options[2]).toBe('');
    });

    it('should not add more than 10 options', () => {
      component.options = Array(10).fill('test');
      component.addOption();
      expect(component.options.length).toBe(10);
    });
  });

  describe('removeOption', () => {
    it('should remove option at specified index', () => {
      component.options = ['A', 'B', 'C'];
      component.removeOption(1);
      expect(component.options).toEqual(['A', 'C']);
    });

    it('should not remove if only 2 options remain', () => {
      component.options = ['A', 'B'];
      component.removeOption(0);
      expect(component.options.length).toBe(2);
    });
  });

  describe('updateOption', () => {
    it('should update option at specified index', () => {
      component.options = ['A', 'B', 'C'];
      component.updateOption(1, 'Updated');
      expect(component.options[1]).toBe('Updated');
    });

    it('should not affect other options', () => {
      component.options = ['A', 'B', 'C'];
      component.updateOption(1, 'Updated');
      expect(component.options[0]).toBe('A');
      expect(component.options[2]).toBe('C');
    });
  });

  describe('isValid getter', () => {
    it('should return false when title is too short', () => {
      component.title = 'AB';
      component.options = ['Option 1', 'Option 2'];
      expect(component.isValid).toBe(false);
    });

    it('should return false when less than 2 valid options', () => {
      component.title = 'Valid Title';
      component.options = ['Option 1', ''];
      expect(component.isValid).toBe(false);
    });

    it('should return true when title and options are valid', () => {
      component.title = 'Valid Title';
      component.options = ['Option 1', 'Option 2'];
      expect(component.isValid).toBe(true);
    });

    it('should ignore empty options in validation', () => {
      component.title = 'Valid Title';
      component.options = ['Option 1', '', 'Option 2', ''];
      expect(component.isValid).toBe(true);
    });

    it('should trim whitespace in validation', () => {
      component.title = '   Valid Title   ';
      component.options = ['  Option 1  ', '  Option 2  '];
      expect(component.isValid).toBe(true);
    });
  });

  describe('onCancel', () => {
    it('should emit cancel result', () => {
      const emitSpy = vi.spyOn(component.resultEvent, 'emit');
      component.onCancel();
      expect(emitSpy).toHaveBeenCalledWith({ action: 'cancel' });
    });
  });

  describe('submit', () => {
    it('should not emit if form is invalid', () => {
      const emitSpy = vi.spyOn(component.resultEvent, 'emit');
      component.title = 'AB'; // Too short
      component.submit();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit create result with form data', () => {
      const emitSpy = vi.spyOn(component.resultEvent, 'emit');
      component.title = '  Test Szavazás  ';
      component.description = '  Test leírás  ';
      component.type = 'template';
      component.options = ['Opció 1', '', 'Opció 2'];
      component.isMultipleChoice = true;
      component.showResultsBeforeVote = true;

      component.submit();

      expect(emitSpy).toHaveBeenCalled();
      const emittedResult = emitSpy.mock.calls[0][0] as VotingCreateResult;
      expect(emittedResult.action).toBe('create');
      expect(emittedResult.data?.title).toBe('Test Szavazás');
      expect(emittedResult.data?.description).toBe('Test leírás');
      expect(emittedResult.data?.type).toBe('template');
      expect(emittedResult.data?.options).toEqual(['Opció 1', 'Opció 2']);
      expect(emittedResult.data?.isMultipleChoice).toBe(true);
      expect(emittedResult.data?.showResultsBeforeVote).toBe(true);
    });

    it('should set description to undefined when empty', () => {
      const emitSpy = vi.spyOn(component.resultEvent, 'emit');
      component.title = 'Test Szavazás';
      component.description = '   ';
      component.options = ['Opció 1', 'Opció 2'];

      component.submit();

      const emittedResult = emitSpy.mock.calls[0][0] as VotingCreateResult;
      expect(emittedResult.data?.description).toBeUndefined();
    });
  });

  describe('trackByIndex', () => {
    it('should return the index', () => {
      expect(component.trackByIndex(5)).toBe(5);
    });
  });

  describe('inputs', () => {
    it('should accept externalErrorMessage input via fixture', () => {
      // Signal inputs need to be set via fixture.componentRef.setInput
      fixture.componentRef.setInput('externalErrorMessage', 'Test error');
      fixture.detectChanges();
      // errorMessage is a signal, call it to get value
      expect(component.errorMessage()).toBe('Test error');
    });

    it('should accept externalIsSubmitting input via fixture', () => {
      // Signal inputs need to be set via fixture.componentRef.setInput
      fixture.componentRef.setInput('externalIsSubmitting', true);
      fixture.detectChanges();
      // isSubmitting is a signal, call it to get value
      expect(component.isSubmitting()).toBe(true);
    });
  });
});
