import { describe, it, expect, beforeEach } from 'vitest';
import { VotingListState } from './voting-list.state';
import { Poll } from '../../../core/services/voting.service';
import { TabloProject } from '../../../core/services/auth.service';

describe('VotingListState', () => {
  let state: VotingListState;

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

  const createMockProject = (overrides: Partial<TabloProject> = {}): TabloProject => ({
    id: 1,
    name: 'Test Projekt',
    slug: 'test-projekt',
    status: 'active',
    expectedClassSize: 25,
    ...overrides
  } as TabloProject);

  beforeEach(() => {
    state = new VotingListState();
  });

  describe('initial state', () => {
    it('should have isLoading as true', () => {
      expect(state.isLoading()).toBe(true);
    });

    it('should have empty polls', () => {
      expect(state.polls()).toEqual([]);
    });

    it('should have null project', () => {
      expect(state.project()).toBeNull();
    });

    it('should have all dialogs closed', () => {
      expect(state.guestDialog.isOpen()).toBe(false);
      expect(state.createDialog.isOpen()).toBe(false);
      expect(state.classSizeDialog.isOpen()).toBe(false);
    });

    it('should have openCreateAfterClassSize as false', () => {
      expect(state.openCreateAfterClassSize()).toBe(false);
    });
  });

  describe('computed values', () => {
    it('should return correct activeCount', () => {
      state.finishLoading([
        createMockPoll({ id: 1, isOpen: true }),
        createMockPoll({ id: 2, isOpen: true }),
        createMockPoll({ id: 3, isOpen: false }),
      ]);
      expect(state.activeCount()).toBe(2);
    });

    it('should return correct activePolls', () => {
      const activePolls = [
        createMockPoll({ id: 1, isOpen: true }),
        createMockPoll({ id: 2, isOpen: true }),
      ];
      state.finishLoading([
        ...activePolls,
        createMockPoll({ id: 3, isOpen: false }),
      ]);
      expect(state.activePolls().length).toBe(2);
      expect(state.activePolls().every(p => p.isOpen)).toBe(true);
    });

    it('should return correct closedPolls', () => {
      state.finishLoading([
        createMockPoll({ id: 1, isOpen: true }),
        createMockPoll({ id: 2, isOpen: false }),
        createMockPoll({ id: 3, isOpen: false }),
      ]);
      expect(state.closedPolls().length).toBe(2);
      expect(state.closedPolls().every(p => !p.isOpen)).toBe(true);
    });

    it('should return correct hasPolls', () => {
      expect(state.hasPolls()).toBe(false);
      state.finishLoading([createMockPoll()]);
      expect(state.hasPolls()).toBe(true);
    });

    describe('needsClassSizeForFirstPoll', () => {
      it('should return true when no project class size and no polls', () => {
        state.updateProject(createMockProject({ expectedClassSize: undefined } as any));
        state.finishLoading([]);
        expect(state.needsClassSizeForFirstPoll()).toBe(true);
      });

      it('should return false when project has class size', () => {
        state.updateProject(createMockProject({ expectedClassSize: 25 }));
        state.finishLoading([]);
        expect(state.needsClassSizeForFirstPoll()).toBe(false);
      });

      it('should return false when polls exist', () => {
        state.updateProject(createMockProject({ expectedClassSize: undefined } as any));
        state.finishLoading([createMockPoll()]);
        expect(state.needsClassSizeForFirstPoll()).toBe(false);
      });
    });
  });

  describe('startLoading', () => {
    it('should set isLoading to true', () => {
      state.finishLoading([]);
      state.startLoading();
      expect(state.isLoading()).toBe(true);
    });
  });

  describe('finishLoading', () => {
    it('should set polls and isLoading to false', () => {
      const polls = [createMockPoll(), createMockPoll({ id: 2 })];
      state.finishLoading(polls);
      expect(state.polls()).toEqual(polls);
      expect(state.isLoading()).toBe(false);
    });
  });

  describe('loadingError', () => {
    it('should set isLoading to false', () => {
      state.loadingError();
      expect(state.isLoading()).toBe(false);
    });
  });

  describe('startCreatePoll', () => {
    it('should open create dialog when project has class size', () => {
      state.updateProject(createMockProject({ expectedClassSize: 25 }));
      state.finishLoading([createMockPoll()]);

      state.startCreatePoll();

      expect(state.createDialog.isOpen()).toBe(true);
      expect(state.classSizeDialog.isOpen()).toBe(false);
    });

    it('should open class size dialog first when no class size and no polls', () => {
      state.updateProject(createMockProject({ expectedClassSize: undefined } as any));
      state.finishLoading([]);

      state.startCreatePoll();

      expect(state.classSizeDialog.isOpen()).toBe(true);
      expect(state.createDialog.isOpen()).toBe(false);
      expect(state.openCreateAfterClassSize()).toBe(true);
    });

    it('should clear errors before opening', () => {
      state.createDialog.setError('Previous error');
      state.updateProject(createMockProject({ expectedClassSize: 25 }));
      state.finishLoading([createMockPoll()]);

      state.startCreatePoll();

      expect(state.createDialog.error()).toBeNull();
    });
  });

  describe('startEditClassSize', () => {
    it('should open class size dialog', () => {
      state.startEditClassSize();
      expect(state.classSizeDialog.isOpen()).toBe(true);
    });

    it('should set openCreateAfterClassSize to false', () => {
      state.openCreateAfterClassSize.set(true);
      state.startEditClassSize();
      expect(state.openCreateAfterClassSize()).toBe(false);
    });

    it('should clear errors before opening', () => {
      state.classSizeDialog.setError('Previous error');
      state.startEditClassSize();
      expect(state.classSizeDialog.error()).toBeNull();
    });
  });

  describe('classSizeSuccess', () => {
    it('should close class size dialog', () => {
      state.classSizeDialog.open();
      state.classSizeSuccess();
      expect(state.classSizeDialog.isOpen()).toBe(false);
    });

    it('should open create dialog when openCreateAfterClassSize is true', () => {
      state.openCreateAfterClassSize.set(true);
      state.classSizeDialog.open();

      state.classSizeSuccess();

      expect(state.createDialog.isOpen()).toBe(true);
      expect(state.openCreateAfterClassSize()).toBe(false);
    });

    it('should not open create dialog when openCreateAfterClassSize is false', () => {
      state.openCreateAfterClassSize.set(false);
      state.classSizeDialog.open();

      state.classSizeSuccess();

      expect(state.createDialog.isOpen()).toBe(false);
    });
  });

  describe('updateProject', () => {
    it('should update the project', () => {
      const project = createMockProject();
      state.updateProject(project);
      expect(state.project()).toEqual(project);
    });

    it('should accept null', () => {
      state.updateProject(createMockProject());
      state.updateProject(null);
      expect(state.project()).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      state.finishLoading([createMockPoll()]);
      state.updateProject(createMockProject());
      state.guestDialog.open();
      state.createDialog.open();
      state.classSizeDialog.open();
      state.openCreateAfterClassSize.set(true);

      state.reset();

      expect(state.isLoading()).toBe(true);
      expect(state.polls()).toEqual([]);
      expect(state.project()).toBeNull();
      expect(state.guestDialog.isOpen()).toBe(false);
      expect(state.createDialog.isOpen()).toBe(false);
      expect(state.classSizeDialog.isOpen()).toBe(false);
      expect(state.openCreateAfterClassSize()).toBe(false);
    });
  });
});
