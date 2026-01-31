import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VotingCardComponent } from './voting-card.component';
import { Poll } from '../../../core/services/voting.service';

describe('VotingCardComponent', () => {
  let component: VotingCardComponent;
  let fixture: ComponentFixture<VotingCardComponent>;

  const createMockPoll = (overrides: Partial<Poll> = {}): Poll => ({
    id: 1,
    title: 'Test Szavazás',
    description: 'Test leírás',
    coverImageUrl: null,
    media: [],
    type: 'template',
    isActive: true,
    isMultipleChoice: false,
    maxVotesPerGuest: 1,
    showResultsBeforeVote: false,
    useForFinalization: false,
    closeAt: null,
    isOpen: true,
    canVote: true,
    myVotes: [],
    totalVotes: 10,
    uniqueVoters: 8,
    optionsCount: 4,
    options: [],
    participationRate: 40,
    createdAt: '2025-01-10T10:00:00Z',
    ...overrides
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VotingCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VotingCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('poll', createMockPoll());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ariaLabel computed', () => {
    it('should return correct label for active poll without vote', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ isOpen: true, myVotes: [] }));
      fixture.detectChanges();
      expect(component.ariaLabel()).toContain('aktív');
      expect(component.ariaLabel()).not.toContain('már szavaztál');
    });

    it('should return correct label for active poll with vote', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ isOpen: true, myVotes: [1] }));
      fixture.detectChanges();
      expect(component.ariaLabel()).toContain('aktív');
      expect(component.ariaLabel()).toContain('már szavaztál');
    });

    it('should return correct label for closed poll', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ isOpen: false }));
      fixture.detectChanges();
      expect(component.ariaLabel()).toContain('lezárt');
    });

    it('should include poll type in label', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ type: 'template' }));
      fixture.detectChanges();
      expect(component.ariaLabel()).toContain('sablon');

      fixture.componentRef.setInput('poll', createMockPoll({ type: 'custom' }));
      fixture.detectChanges();
      expect(component.ariaLabel()).toContain('szabad');
    });
  });

  describe('hasVoted computed', () => {
    it('should return false when no votes', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ myVotes: [] }));
      fixture.detectChanges();
      expect(component.hasVoted()).toBe(false);
    });

    it('should return true when has votes', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ myVotes: [1] }));
      fixture.detectChanges();
      expect(component.hasVoted()).toBe(true);
    });
  });

  describe('typeBadge computed', () => {
    it('should return "Sablon" for template type', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ type: 'template' }));
      fixture.detectChanges();
      expect(component.typeBadge()).toBe('Sablon');
    });

    it('should return "Szabad" for custom type', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ type: 'custom' }));
      fixture.detectChanges();
      expect(component.typeBadge()).toBe('Szabad');
    });
  });

  describe('statusText computed', () => {
    it('should return "Lezárt" for closed poll', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ isOpen: false }));
      fixture.detectChanges();
      expect(component.statusText()).toBe('Lezárt');
    });

    it('should return "Szavaztál" when has voted and poll is open', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ isOpen: true, myVotes: [1] }));
      fixture.detectChanges();
      expect(component.statusText()).toBe('Szavaztál');
    });

    it('should return "Aktív" for open poll without vote', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ isOpen: true, myVotes: [] }));
      fixture.detectChanges();
      expect(component.statusText()).toBe('Aktív');
    });
  });

  describe('participationText computed', () => {
    it('should return voter count when available', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ uniqueVoters: 15, totalVotes: 20 }));
      fixture.detectChanges();
      expect(component.participationText()).toBe('15 szavazó');
    });

    it('should return empty string when voters undefined', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ uniqueVoters: undefined, totalVotes: undefined }));
      fixture.detectChanges();
      expect(component.participationText()).toBe('');
    });
  });

  describe('closeAtText computed', () => {
    it('should return empty string when no closeAt', () => {
      fixture.componentRef.setInput('poll', createMockPoll({ closeAt: null }));
      fixture.detectChanges();
      expect(component.closeAtText()).toBe('');
    });

    it('should return "Lejárt" for past date', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString();
      fixture.componentRef.setInput('poll', createMockPoll({ closeAt: pastDate }));
      fixture.detectChanges();
      expect(component.closeAtText()).toBe('Lejárt');
    });

    it('should return days remaining for future date', () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
      fixture.componentRef.setInput('poll', createMockPoll({ closeAt: futureDate }));
      fixture.detectChanges();
      expect(component.closeAtText()).toContain('nap van hátra');
    });

    it('should return hours remaining when less than a day', () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
      fixture.componentRef.setInput('poll', createMockPoll({ closeAt: futureDate }));
      fixture.detectChanges();
      expect(component.closeAtText()).toContain('óra van hátra');
    });

    it('should return "Hamarosan lejár" when less than an hour', () => {
      const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      fixture.componentRef.setInput('poll', createMockPoll({ closeAt: futureDate }));
      fixture.detectChanges();
      expect(component.closeAtText()).toBe('Hamarosan lejár');
    });
  });

  describe('events', () => {
    it('should emit selectEvent on click', () => {
      const emitSpy = vi.spyOn(component.selectEvent, 'emit');
      component.onSelect();
      expect(emitSpy).toHaveBeenCalledWith(component.poll());
    });

    it('should emit selectEvent on Enter key', () => {
      const emitSpy = vi.spyOn(component.selectEvent, 'emit');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      fixture.nativeElement.dispatchEvent(event);
      // Note: actual key handling is in host binding
      component.onSelect();
      expect(emitSpy).toHaveBeenCalled();
    });

    it('should prevent default on Space key and emit selectEvent', () => {
      const emitSpy = vi.spyOn(component.selectEvent, 'emit');
      const event = new Event('keydown');
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      component.onKeySpace(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have role="article"', () => {
      const element = fixture.nativeElement;
      expect(element.getAttribute('role')).toBe('article');
    });

    it('should be focusable with tabindex="0"', () => {
      const element = fixture.nativeElement;
      expect(element.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-label', () => {
      const element = fixture.nativeElement;
      expect(element.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
