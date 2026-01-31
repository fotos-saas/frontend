import { describe, it, expect, beforeEach } from 'vitest';
import { VotingDetailState } from './voting-detail.state';
import { Poll, PollOption } from '../../../core/services/voting.service';

describe('VotingDetailState', () => {
  let state: VotingDetailState;

  const createMockOption = (overrides: Partial<PollOption> = {}): PollOption => ({
    id: 1,
    label: 'Test Opció',
    description: 'Opció leírás',
    imageUrl: null,
    templateId: null,
    templateName: null,
    votesCount: 5,
    percentage: 25,
    ...overrides
  });

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
    options: [createMockOption({ id: 1 }), createMockOption({ id: 2 })],
    participationRate: 40,
    createdAt: '2025-01-10T10:00:00Z',
    ...overrides
  });

  beforeEach(() => {
    state = new VotingDetailState();
  });

  describe('initial state', () => {
    it('should have null poll', () => {
      expect(state.poll()).toBeNull();
    });

    it('should have isLoading as true', () => {
      expect(state.isLoading()).toBe(true);
    });

    it('should have isVoting as false', () => {
      expect(state.isVoting()).toBe(false);
    });

    it('should have null errorMessage', () => {
      expect(state.errorMessage()).toBeNull();
    });

    it('should have null successMessage', () => {
      expect(state.successMessage()).toBeNull();
    });

    it('should have guest dialog closed', () => {
      expect(state.guestDialog.isOpen()).toBe(false);
    });
  });

  describe('computed values', () => {
    describe('hasPoll', () => {
      it('should return false when poll is null', () => {
        expect(state.hasPoll()).toBe(false);
      });

      it('should return true when poll is set', () => {
        state.finishLoading(createMockPoll());
        expect(state.hasPoll()).toBe(true);
      });
    });

    describe('isOpen', () => {
      it('should return false when poll is null', () => {
        expect(state.isOpen()).toBe(false);
      });

      it('should return poll.isOpen value', () => {
        state.finishLoading(createMockPoll({ isOpen: true }));
        expect(state.isOpen()).toBe(true);

        state.finishLoading(createMockPoll({ isOpen: false }));
        expect(state.isOpen()).toBe(false);
      });
    });

    describe('showResults', () => {
      it('should return false when poll is null', () => {
        expect(state.showResults()).toBe(false);
      });

      it('should return true when user has voted', () => {
        state.finishLoading(createMockPoll({ myVotes: [1] }));
        expect(state.showResults()).toBe(true);
      });

      it('should return true when showResultsBeforeVote is true', () => {
        state.finishLoading(createMockPoll({ showResultsBeforeVote: true, myVotes: [] }));
        expect(state.showResults()).toBe(true);
      });

      it('should return true when poll is closed', () => {
        state.finishLoading(createMockPoll({ isOpen: false, myVotes: [] }));
        expect(state.showResults()).toBe(true);
      });

      it('should return false when none of conditions met', () => {
        state.finishLoading(createMockPoll({ isOpen: true, showResultsBeforeVote: false, myVotes: [] }));
        expect(state.showResults()).toBe(false);
      });
    });

    describe('isMultipleChoice', () => {
      it('should return false when poll is null', () => {
        expect(state.isMultipleChoice()).toBe(false);
      });

      it('should return poll.isMultipleChoice value', () => {
        state.finishLoading(createMockPoll({ isMultipleChoice: true }));
        expect(state.isMultipleChoice()).toBe(true);

        state.finishLoading(createMockPoll({ isMultipleChoice: false }));
        expect(state.isMultipleChoice()).toBe(false);
      });
    });
  });

  describe('startLoading', () => {
    it('should set isLoading to true', () => {
      state.finishLoading(createMockPoll());
      state.startLoading();
      expect(state.isLoading()).toBe(true);
    });

    it('should clear errorMessage', () => {
      state.setError('Previous error');
      state.startLoading();
      expect(state.errorMessage()).toBeNull();
    });
  });

  describe('finishLoading', () => {
    it('should set poll and isLoading to false', () => {
      const poll = createMockPoll();
      state.finishLoading(poll);
      expect(state.poll()).toEqual(poll);
      expect(state.isLoading()).toBe(false);
    });
  });

  describe('loadingError', () => {
    it('should set errorMessage and isLoading to false', () => {
      state.loadingError('Betöltési hiba');
      expect(state.errorMessage()).toBe('Betöltési hiba');
      expect(state.isLoading()).toBe(false);
    });
  });

  describe('startVoting', () => {
    it('should set isVoting to true', () => {
      state.startVoting();
      expect(state.isVoting()).toBe(true);
    });

    it('should clear errorMessage', () => {
      state.setError('Previous error');
      state.startVoting();
      expect(state.errorMessage()).toBeNull();
    });

    it('should clear successMessage', () => {
      state.voteSuccess('Previous success');
      state.startVoting();
      expect(state.successMessage()).toBeNull();
    });
  });

  describe('voteSuccess', () => {
    it('should set successMessage and isVoting to false', () => {
      state.startVoting();
      state.voteSuccess('Sikeres szavazat!');
      expect(state.successMessage()).toBe('Sikeres szavazat!');
      expect(state.isVoting()).toBe(false);
    });
  });

  describe('voteError', () => {
    it('should set errorMessage and isVoting to false', () => {
      state.startVoting();
      state.voteError('Szavazási hiba');
      expect(state.errorMessage()).toBe('Szavazási hiba');
      expect(state.isVoting()).toBe(false);
    });
  });

  describe('hasVotedFor', () => {
    it('should return false when poll is null', () => {
      expect(state.hasVotedFor(createMockOption({ id: 1 }))).toBe(false);
    });

    it('should return true when option id is in myVotes', () => {
      state.finishLoading(createMockPoll({ myVotes: [1, 2] }));
      expect(state.hasVotedFor(createMockOption({ id: 1 }))).toBe(true);
      expect(state.hasVotedFor(createMockOption({ id: 2 }))).toBe(true);
    });

    it('should return false when option id is not in myVotes', () => {
      state.finishLoading(createMockPoll({ myVotes: [1] }));
      expect(state.hasVotedFor(createMockOption({ id: 3 }))).toBe(false);
    });
  });

  describe('canVoteForOption', () => {
    it('should return false when poll is null', () => {
      expect(state.canVoteForOption(createMockOption())).toBe(false);
    });

    it('should return false when poll is closed', () => {
      state.finishLoading(createMockPoll({ isOpen: false }));
      expect(state.canVoteForOption(createMockOption())).toBe(false);
    });

    it('should return false when isVoting is true', () => {
      state.finishLoading(createMockPoll());
      state.startVoting();
      expect(state.canVoteForOption(createMockOption())).toBe(false);
    });

    it('should return false when already voted and not multiple choice', () => {
      state.finishLoading(createMockPoll({ isMultipleChoice: false, myVotes: [1] }));
      expect(state.canVoteForOption(createMockOption({ id: 1 }))).toBe(false);
    });

    it('should return false when max votes reached and not voted for this option', () => {
      state.finishLoading(createMockPoll({ canVote: false, myVotes: [1] }));
      expect(state.canVoteForOption(createMockOption({ id: 2 }))).toBe(false);
    });

    it('should return true for new option when canVote is true', () => {
      state.finishLoading(createMockPoll({ canVote: true, myVotes: [] }));
      expect(state.canVoteForOption(createMockOption())).toBe(true);
    });
  });

  describe('getOptionAriaLabel', () => {
    it('should return just label when poll is null', () => {
      expect(state.getOptionAriaLabel(createMockOption({ label: 'Test' }))).toBe('Test');
    });

    it('should include voted status when voted', () => {
      state.finishLoading(createMockPoll({ myVotes: [1], isOpen: true, canVote: true }));
      const label = state.getOptionAriaLabel(createMockOption({ id: 1, label: 'Test', percentage: 40 }));
      expect(label).toContain('kiválasztva');
    });

    it('should include percentage when available', () => {
      state.finishLoading(createMockPoll({ myVotes: [], isOpen: true, canVote: true }));
      const label = state.getOptionAriaLabel(createMockOption({ label: 'Test', percentage: 40 }));
      expect(label).toContain('40%');
    });

    it('should indicate closed poll', () => {
      state.finishLoading(createMockPoll({ isOpen: false }));
      const label = state.getOptionAriaLabel(createMockOption({ label: 'Test' }));
      expect(label).toContain('lezárult');
    });

    it('should indicate max votes reached', () => {
      state.finishLoading(createMockPoll({ canVote: false, myVotes: [1], isOpen: true }));
      const label = state.getOptionAriaLabel(createMockOption({ id: 2, label: 'Test' }));
      expect(label).toContain('maximális szavazatszámot');
    });

    it('should include voting instructions for active poll', () => {
      state.finishLoading(createMockPoll({ isOpen: true, canVote: true, myVotes: [] }));
      const label = state.getOptionAriaLabel(createMockOption({ label: 'Test' }));
      expect(label).toContain('Entert');
      expect(label).toContain('Space');
    });
  });

  describe('setError', () => {
    it('should set errorMessage', () => {
      state.setError('Test hiba');
      expect(state.errorMessage()).toBe('Test hiba');
    });
  });

  describe('clearError', () => {
    it('should clear errorMessage', () => {
      state.setError('Test hiba');
      state.clearError();
      expect(state.errorMessage()).toBeNull();
    });
  });

  describe('clearSuccess', () => {
    it('should clear successMessage', () => {
      state.voteSuccess('Sikeres');
      state.clearSuccess();
      expect(state.successMessage()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      state.finishLoading(createMockPoll());
      state.startVoting();
      state.setError('Error');
      state.guestDialog.open();

      state.reset();

      expect(state.poll()).toBeNull();
      expect(state.isLoading()).toBe(true);
      expect(state.isVoting()).toBe(false);
      expect(state.errorMessage()).toBeNull();
      expect(state.successMessage()).toBeNull();
      expect(state.guestDialog.isOpen()).toBe(false);
    });
  });
});
