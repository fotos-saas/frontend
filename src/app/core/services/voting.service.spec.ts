/**
 * VotingService Unit Tests
 *
 * Tesztek:
 * - Szavazások betöltése
 * - Szavazás részleteinek lekérése
 * - Eredmények lekérése
 * - Szavazat leadás és visszavonás
 * - CRUD műveletek (kapcsolattartó)
 * - X-Guest-Session header kezelés
 * - Hibakezelés
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { VotingService, Poll, PollResults, VoteResponse, CreatePollRequest } from './voting.service';
import { GuestService } from './guest.service';
import { environment } from '../../../environments/environment';

describe('VotingService', () => {
  let service: VotingService;
  let httpMock: HttpTestingController;
  let guestServiceMock: { getSessionToken: ReturnType<typeof vi.fn> };

  const API_BASE = `${environment.apiUrl}/tablo-frontend/polls`;

  const mockPollApiResponse = {
    id: 1,
    title: 'Melyik sablon tetszik?',
    description: 'Válassz a sablonok közül',
    type: 'template',
    is_active: true,
    is_multiple_choice: false,
    max_votes_per_guest: 1,
    show_results_before_vote: false,
    use_for_finalization: true,
    close_at: null,
    is_open: true,
    can_vote: true,
    my_votes: [],
    total_votes: 10,
    unique_voters: 8,
    options_count: 3,
    options: [
      { id: 1, label: 'Sablon A', description: null, image_url: '/img/a.jpg', template_id: 1, template_name: 'Klasszikus', votes_count: 5, percentage: 50 },
      { id: 2, label: 'Sablon B', description: null, image_url: '/img/b.jpg', template_id: 2, template_name: 'Modern', votes_count: 3, percentage: 30 },
      { id: 3, label: 'Sablon C', description: null, image_url: '/img/c.jpg', template_id: 3, template_name: 'Retro', votes_count: 2, percentage: 20 }
    ],
    participation_rate: 80,
    created_at: '2024-01-15T10:00:00Z'
  };

  beforeEach(() => {
    guestServiceMock = {
      getSessionToken: vi.fn().mockReturnValue('test-session-token-123')
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        VotingService,
        { provide: GuestService, useValue: guestServiceMock }
      ]
    });

    service = TestBed.inject(VotingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ==================== LOAD POLLS TESZTEK ====================

  describe('loadPolls', () => {
    it('should load all polls successfully', async () => {
      const pollsPromise = firstValueFrom(service.loadPolls());

      const req = httpMock.expectOne(API_BASE);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('X-Guest-Session')).toBe('test-session-token-123');

      req.flush({ success: true, data: [mockPollApiResponse] });

      const polls = await pollsPromise;
      expect(polls.length).toBe(1);
      expect(polls[0].title).toBe('Melyik sablon tetszik?');
      expect(polls[0].isActive).toBe(true);
      expect(polls[0].options?.length).toBe(3);
    });

    it('should load only active polls when activeOnly is true', async () => {
      const pollsPromise = firstValueFrom(service.loadPolls(true));

      const req = httpMock.expectOne(`${API_BASE}?active_only=true`);
      expect(req.request.method).toBe('GET');

      req.flush({ success: true, data: [mockPollApiResponse] });

      await pollsPromise;
    });

    it('should set isLoading signal correctly during load', async () => {
      expect(service.isLoading()).toBe(false);

      const pollsPromise = firstValueFrom(service.loadPolls());

      expect(service.isLoading()).toBe(true);

      const req = httpMock.expectOne(API_BASE);
      req.flush({ success: true, data: [] });

      await pollsPromise;

      expect(service.isLoading()).toBe(false);
    });

    it('should update polls$ subject after successful load', async () => {
      const pollsPromise = firstValueFrom(service.loadPolls());

      const req = httpMock.expectOne(API_BASE);
      req.flush({ success: true, data: [mockPollApiResponse] });

      await pollsPromise;

      const polls = await firstValueFrom(service.polls$);
      expect(polls[0].id).toBe(1);
    });

    it('should throw error when response is not successful', async () => {
      const pollsPromise = firstValueFrom(service.loadPolls()).catch(e => e);

      const req = httpMock.expectOne(API_BASE);
      req.flush({ success: false, data: [] });

      const error = await pollsPromise;
      expect(error).toBeInstanceOf(Error);
      // A service dob hibát, amit a handleError 'Hiba történt. Próbáld újra!'-ra alakít
      expect(error.message).toBe('Hiba történt. Próbáld újra!');
    });

    it('should handle network error', async () => {
      const pollsPromise = firstValueFrom(service.loadPolls()).catch(e => e);

      const req = httpMock.expectOne(API_BASE);
      req.error(new ProgressEvent('error'), { status: 0 });

      const error = await pollsPromise;
      expect(error.message).toBe('Nincs internetkapcsolat.');
    });
  });

  // ==================== GET POLL TESZTEK ====================

  describe('getPoll', () => {
    it('should get poll by id successfully', async () => {
      const pollPromise = firstValueFrom(service.getPoll(1));

      const req = httpMock.expectOne(`${API_BASE}/1`);
      expect(req.request.method).toBe('GET');

      req.flush({ success: true, data: mockPollApiResponse });

      const poll = await pollPromise;
      expect(poll.id).toBe(1);
      expect(poll.title).toBe('Melyik sablon tetszik?');
      expect(service.selectedPoll()?.id).toBe(1);
    });

    it('should update selectedPoll signal', async () => {
      expect(service.selectedPoll()).toBeNull();

      const pollPromise = firstValueFrom(service.getPoll(1));

      const req = httpMock.expectOne(`${API_BASE}/1`);
      req.flush({ success: true, data: mockPollApiResponse });

      await pollPromise;

      expect(service.selectedPoll()?.id).toBe(1);
    });

    it('should throw error when poll not found', async () => {
      const pollPromise = firstValueFrom(service.getPoll(999)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/999`);
      req.flush({ success: false, data: null });

      const error = await pollPromise;
      // A service dob hibát, amit a handleError 'Hiba történt. Próbáld újra!'-ra alakít
      expect(error.message).toBe('Hiba történt. Próbáld újra!');
    });
  });

  // ==================== GET RESULTS TESZTEK ====================

  describe('getResults', () => {
    it('should get poll results successfully', async () => {
      const resultsPromise = firstValueFrom(service.getResults(1));

      const req = httpMock.expectOne(`${API_BASE}/1/results`);
      expect(req.request.method).toBe('GET');

      req.flush({
        success: true,
        data: {
          poll_id: 1,
          title: 'Melyik sablon tetszik?',
          is_open: true,
          total_votes: 10,
          unique_voters: 8,
          participation_rate: 80,
          options: [
            { id: 1, label: 'Sablon A', description: null, image_url: '/img/a.jpg', template_id: 1, votes_count: 5, percentage: 50 },
            { id: 2, label: 'Sablon B', description: null, image_url: '/img/b.jpg', template_id: 2, votes_count: 3, percentage: 30 }
          ]
        }
      });

      const results = await resultsPromise;
      expect(results.pollId).toBe(1);
      expect(results.totalVotes).toBe(10);
      expect(results.participationRate).toBe(80);
      expect(results.options.length).toBe(2);
    });

    it('should throw error when results not available', async () => {
      const resultsPromise = firstValueFrom(service.getResults(1)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/1/results`);
      req.flush({ success: false, data: null });

      const error = await resultsPromise;
      // A service dob hibát, amit a handleError 'Hiba történt. Próbáld újra!'-ra alakít
      expect(error.message).toBe('Hiba történt. Próbáld újra!');
    });
  });

  // ==================== VOTE TESZTEK ====================

  describe('vote', () => {
    it('should submit vote successfully', async () => {
      const votePromise = firstValueFrom(service.vote(1, 1));

      const req = httpMock.expectOne(`${API_BASE}/1/vote`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ option_id: 1 });
      expect(req.request.headers.get('X-Guest-Session')).toBe('test-session-token-123');

      req.flush({
        success: true,
        message: 'Szavazat sikeresen rögzítve!',
        data: { vote_id: 123, my_votes: [1], can_vote_more: false }
      });

      const response = await votePromise;
      expect(response.success).toBe(true);
      expect(response.data?.voteId).toBe(123);
      expect(response.data?.myVotes).toEqual([1]);
      expect(response.data?.canVoteMore).toBe(false);
    });

    it('should update local poll votes after successful vote', async () => {
      // First, load polls
      const loadPromise = firstValueFrom(service.loadPolls());
      httpMock.expectOne(API_BASE).flush({ success: true, data: [mockPollApiResponse] });
      await loadPromise;

      // Then vote
      const votePromise = firstValueFrom(service.vote(1, 1));

      httpMock.expectOne(`${API_BASE}/1/vote`).flush({
        success: true,
        message: 'Szavazat sikeresen rögzítve!',
        data: { vote_id: 123, my_votes: [1], can_vote_more: false }
      });

      await votePromise;

      // Check that polls$ was updated
      const polls = await firstValueFrom(service.polls$);
      const poll = polls.find(p => p.id === 1);
      expect(poll?.myVotes).toEqual([1]);
    });

    it('should handle vote error with custom message', async () => {
      const votePromise = firstValueFrom(service.vote(1, 1)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/1/vote`);
      req.flush({ message: 'Már szavaztál erre az opcióra!' }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await votePromise;
      expect(error.message).toBe('Már szavaztál erre az opcióra!');
    });

    it('should handle class size required error', async () => {
      const votePromise = firstValueFrom(service.vote(1, 1)).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/1/vote`);
      req.flush({ requires_class_size: true }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await votePromise;
      expect(error.message).toBe('Először állítsd be az osztálylétszámot!');
    });
  });

  // ==================== REMOVE VOTE TESZTEK ====================

  describe('removeVote', () => {
    it('should remove vote successfully', async () => {
      const removePromise = firstValueFrom(service.removeVote(1, 1));

      const req = httpMock.expectOne(`${API_BASE}/1/vote`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ option_id: 1 });

      req.flush({ success: true, message: 'Szavazat visszavonva!', data: { my_votes: [] } });

      const response = await removePromise;
      expect(response.success).toBe(true);
      expect(response.message).toBe('Szavazat visszavonva!');
    });

    it('should remove all votes when optionId not provided', async () => {
      const removePromise = firstValueFrom(service.removeVote(1));

      const req = httpMock.expectOne(`${API_BASE}/1/vote`);
      expect(req.request.body).toEqual({});

      req.flush({ success: true, message: 'Összes szavazat visszavonva!', data: { my_votes: [] } });

      await removePromise;
    });
  });

  // ==================== CREATE POLL TESZTEK ====================

  describe('createPoll', () => {
    it('should create poll successfully', async () => {
      const createRequest: CreatePollRequest = {
        title: 'Új szavazás',
        description: 'Teszt leírás',
        type: 'template',
        is_multiple_choice: false,
        options: [
          { label: 'Opció 1', template_id: 1 },
          { label: 'Opció 2', template_id: 2 }
        ]
      };

      const createPromise = firstValueFrom(service.createPoll(createRequest));

      const createReq = httpMock.expectOne(API_BASE);
      expect(createReq.request.method).toBe('POST');
      // A service FormData-t használ, nem JSON-t
      expect(createReq.request.body instanceof FormData).toBe(true);
      const formData = createReq.request.body as FormData;
      expect(formData.get('title')).toBe('Új szavazás');
      expect(formData.get('type')).toBe('template');

      createReq.flush({
        success: true,
        message: 'Szavazás létrehozva!',
        data: { ...mockPollApiResponse, id: 2, title: 'Új szavazás' }
      });

      // Should trigger reload
      const reloadReq = httpMock.expectOne(API_BASE);
      reloadReq.flush({ success: true, data: [] });

      const poll = await createPromise;
      expect(poll.id).toBe(2);
      expect(poll.title).toBe('Új szavazás');
    });

    it('should throw error when creation fails', async () => {
      const createPromise = firstValueFrom(service.createPoll({ title: '', type: 'custom' })).catch(e => e);

      const req = httpMock.expectOne(API_BASE);
      // HTTP hiba szimulálása az üzenettel
      req.flush({ message: 'A cím megadása kötelező!' }, { status: 422, statusText: 'Unprocessable Entity' });

      const error = await createPromise;
      expect(error.message).toBe('A cím megadása kötelező!');
    });
  });

  // ==================== UPDATE POLL TESZTEK ====================

  describe('updatePoll', () => {
    it('should update poll successfully', async () => {
      const updateData = { title: 'Módosított cím' };
      const updatePromise = firstValueFrom(service.updatePoll(1, updateData));

      const updateReq = httpMock.expectOne(`${API_BASE}/1`);
      // Laravel PUT method spoofing: POST + _method=PUT a FormData-ban
      expect(updateReq.request.method).toBe('POST');
      expect(updateReq.request.body instanceof FormData).toBe(true);
      const formData = updateReq.request.body as FormData;
      expect(formData.get('title')).toBe('Módosított cím');
      expect(formData.get('_method')).toBe('PUT');

      updateReq.flush({ success: true, message: 'Szavazás módosítva!' });

      // Should trigger reload
      const reloadReq = httpMock.expectOne(API_BASE);
      reloadReq.flush({ success: true, data: [] });

      await updatePromise;
    });

    it('should throw error when update fails', async () => {
      const updatePromise = firstValueFrom(service.updatePoll(1, { title: 'New' })).catch(e => e);

      const req = httpMock.expectOne(`${API_BASE}/1`);
      // HTTP hiba szimulálása az üzenettel
      req.flush({ message: 'Nincs jogosultság!' }, { status: 403, statusText: 'Forbidden' });

      const error = await updatePromise;
      expect(error.message).toBe('Nincs jogosultság!');
    });
  });

  // ==================== DELETE POLL TESZTEK ====================

  describe('deletePoll', () => {
    it('should delete poll successfully', async () => {
      // First, load polls
      const loadPromise = firstValueFrom(service.loadPolls());
      httpMock.expectOne(API_BASE).flush({ success: true, data: [mockPollApiResponse] });
      await loadPromise;

      // Then delete
      const deletePromise = firstValueFrom(service.deletePoll(1));

      const req = httpMock.expectOne(`${API_BASE}/1`);
      expect(req.request.method).toBe('DELETE');

      req.flush({ success: true, message: 'Szavazás törölve!' });

      await deletePromise;
    });

    it('should remove deleted poll from local state', async () => {
      // Load polls first
      const loadPromise = firstValueFrom(service.loadPolls());
      httpMock.expectOne(API_BASE).flush({ success: true, data: [mockPollApiResponse] });
      await loadPromise;

      // Delete
      const deletePromise = firstValueFrom(service.deletePoll(1));

      httpMock.expectOne(`${API_BASE}/1`).flush({ success: true, message: 'Törölve!' });

      await deletePromise;

      const polls = await firstValueFrom(service.polls$);
      expect(polls.find(p => p.id === 1)).toBeUndefined();
    });
  });

  // ==================== HEADER TESZTEK ====================

  describe('X-Guest-Session header', () => {
    it('should include X-Guest-Session header when session exists', async () => {
      guestServiceMock.getSessionToken.mockReturnValue('my-session-token');

      const pollsPromise = firstValueFrom(service.loadPolls());

      const req = httpMock.expectOne(API_BASE);
      expect(req.request.headers.get('X-Guest-Session')).toBe('my-session-token');

      req.flush({ success: true, data: [] });

      await pollsPromise;
    });

    it('should not include X-Guest-Session header when no session', async () => {
      guestServiceMock.getSessionToken.mockReturnValue(null);

      const pollsPromise = firstValueFrom(service.loadPolls());

      const req = httpMock.expectOne(API_BASE);
      expect(req.request.headers.has('X-Guest-Session')).toBe(false);

      req.flush({ success: true, data: [] });

      await pollsPromise;
    });
  });

  // ==================== MAPPING TESZTEK ====================

  describe('API mapping', () => {
    it('should correctly map poll from API response', async () => {
      const pollPromise = firstValueFrom(service.getPoll(1));

      const req = httpMock.expectOne(`${API_BASE}/1`);
      req.flush({ success: true, data: mockPollApiResponse });

      const poll = await pollPromise;

      // Check snake_case to camelCase mapping
      expect(poll.isActive).toBe(true);
      expect(poll.isMultipleChoice).toBe(false);
      expect(poll.maxVotesPerGuest).toBe(1);
      expect(poll.showResultsBeforeVote).toBe(false);
      expect(poll.useForFinalization).toBe(true);
      expect(poll.closeAt).toBeNull();
      expect(poll.isOpen).toBe(true);
      expect(poll.canVote).toBe(true);
      expect(poll.myVotes).toEqual([]);
      expect(poll.totalVotes).toBe(10);
      expect(poll.uniqueVoters).toBe(8);
      expect(poll.optionsCount).toBe(3);
      expect(poll.participationRate).toBe(80);
      expect(poll.createdAt).toBe('2024-01-15T10:00:00Z');

      // Check options mapping
      expect(poll.options?.[0].imageUrl).toBe('/img/a.jpg');
      expect(poll.options?.[0].templateId).toBe(1);
      expect(poll.options?.[0].templateName).toBe('Klasszikus');
      expect(poll.options?.[0].votesCount).toBe(5);
    });

    it('should correctly map results from API response', async () => {
      const resultsPromise = firstValueFrom(service.getResults(1));

      const req = httpMock.expectOne(`${API_BASE}/1/results`);
      req.flush({
        success: true,
        data: {
          poll_id: 1,
          title: 'Test Poll',
          is_open: true,
          total_votes: 10,
          unique_voters: 8,
          participation_rate: 80,
          options: [
            { id: 1, label: 'A', description: null, image_url: '/a.jpg', template_id: 1, votes_count: 5, percentage: 50 }
          ]
        }
      });

      const results = await resultsPromise;

      expect(results.pollId).toBe(1);
      expect(results.isOpen).toBe(true);
      expect(results.totalVotes).toBe(10);
      expect(results.uniqueVoters).toBe(8);
      expect(results.participationRate).toBe(80);
      expect(results.options[0].imageUrl).toBe('/a.jpg');
      expect(results.options[0].templateId).toBe(1);
      expect(results.options[0].votesCount).toBe(5);
    });
  });
});
