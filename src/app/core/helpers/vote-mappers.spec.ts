import { describe, it, expect } from 'vitest';
import {
  mapMediaFromApi,
  mapPollFromApi,
  mapOptionFromApi,
  mapResultsFromApi
} from './vote-mappers';
import { ApiPollResponse, ApiPollOptionResponse, ApiResultsResponse, ApiPollMediaResponse } from '../models/voting.models';

describe('vote-mappers', () => {

  // ============================================================================
  // mapMediaFromApi
  // ============================================================================
  describe('mapMediaFromApi', () => {
    it('should map API media response to PollMedia', () => {
      const apiMedia: ApiPollMediaResponse = {
        id: 1,
        url: 'https://example.com/image.jpg',
        fileName: 'image.jpg',
        sortOrder: 0
      };

      const result = mapMediaFromApi(apiMedia);

      expect(result).toEqual({
        id: 1,
        url: 'https://example.com/image.jpg',
        fileName: 'image.jpg',
        sortOrder: 0
      });
    });
  });

  // ============================================================================
  // mapOptionFromApi
  // ============================================================================
  describe('mapOptionFromApi', () => {
    it('should map API option response to PollOption', () => {
      const apiOption: ApiPollOptionResponse = {
        id: 1,
        label: 'Option 1',
        description: 'Description',
        image_url: 'https://example.com/opt.jpg',
        template_id: 10,
        template_name: 'Template A',
        votes_count: 5,
        percentage: 25.5
      };

      const result = mapOptionFromApi(apiOption);

      expect(result).toEqual({
        id: 1,
        label: 'Option 1',
        description: 'Description',
        imageUrl: 'https://example.com/opt.jpg',
        templateId: 10,
        templateName: 'Template A',
        votesCount: 5,
        percentage: 25.5
      });
    });

    it('should handle null template_name', () => {
      const apiOption: ApiPollOptionResponse = {
        id: 2,
        label: 'Option 2',
        votes_count: 0,
        percentage: 0
      };

      const result = mapOptionFromApi(apiOption);

      expect(result.templateName).toBeNull();
    });
  });

  // ============================================================================
  // mapPollFromApi
  // ============================================================================
  describe('mapPollFromApi', () => {
    it('should map API poll response to Poll', () => {
      const apiPoll: ApiPollResponse = {
        id: 1,
        title: 'Test Poll',
        description: 'Test Description',
        cover_image_url: 'https://example.com/cover.jpg',
        media: [
          { id: 1, url: 'https://example.com/m1.jpg', fileName: 'file1.jpg', sortOrder: 0 }
        ],
        type: 'custom',
        is_active: true,
        is_multiple_choice: false,
        max_votes_per_guest: 1,
        show_results_before_vote: false,
        use_for_finalization: true,
        close_at: '2025-12-31T23:59:59Z',
        is_open: true,
        can_vote: true,
        my_votes: [1, 2],
        total_votes: 10,
        unique_voters: 8,
        options_count: 3,
        options: [
          { id: 1, label: 'Opt 1', votes_count: 5, percentage: 50 }
        ],
        participation_rate: 80,
        created_at: '2025-01-01T10:00:00Z'
      };

      const result = mapPollFromApi(apiPoll);

      expect(result.id).toBe(1);
      expect(result.title).toBe('Test Poll');
      expect(result.description).toBe('Test Description');
      expect(result.coverImageUrl).toBe('https://example.com/cover.jpg');
      expect(result.media).toHaveLength(1);
      expect(result.type).toBe('custom');
      expect(result.isActive).toBe(true);
      expect(result.isMultipleChoice).toBe(false);
      expect(result.maxVotesPerGuest).toBe(1);
      expect(result.showResultsBeforeVote).toBe(false);
      expect(result.useForFinalization).toBe(true);
      expect(result.closeAt).toBe('2025-12-31T23:59:59Z');
      expect(result.isOpen).toBe(true);
      expect(result.canVote).toBe(true);
      expect(result.myVotes).toEqual([1, 2]);
      expect(result.totalVotes).toBe(10);
      expect(result.uniqueVoters).toBe(8);
      expect(result.optionsCount).toBe(3);
      expect(result.options).toHaveLength(1);
      expect(result.participationRate).toBe(80);
      expect(result.createdAt).toBe('2025-01-01T10:00:00Z');
    });

    it('should handle empty media and my_votes', () => {
      const apiPoll: ApiPollResponse = {
        id: 2,
        title: 'Empty Poll',
        type: 'template',
        is_active: true,
        is_multiple_choice: false,
        max_votes_per_guest: 1,
        show_results_before_vote: true,
        use_for_finalization: false,
        is_open: false,
        can_vote: false,
        total_votes: 0,
        unique_voters: 0,
        options_count: 0,
        created_at: '2025-01-01T10:00:00Z'
      };

      const result = mapPollFromApi(apiPoll);

      expect(result.media).toEqual([]);
      expect(result.myVotes).toEqual([]);
      expect(result.options).toBeUndefined();
    });
  });

  // ============================================================================
  // mapResultsFromApi
  // ============================================================================
  describe('mapResultsFromApi', () => {
    it('should map API results response to PollResults', () => {
      const apiResults: ApiResultsResponse = {
        poll_id: 1,
        title: 'Poll Results',
        is_open: false,
        total_votes: 20,
        unique_voters: 15,
        participation_rate: 75,
        options: [
          { id: 1, label: 'Winner', votes_count: 12, percentage: 60 },
          { id: 2, label: 'Runner-up', votes_count: 8, percentage: 40 }
        ]
      };

      const result = mapResultsFromApi(apiResults);

      expect(result.pollId).toBe(1);
      expect(result.title).toBe('Poll Results');
      expect(result.isOpen).toBe(false);
      expect(result.totalVotes).toBe(20);
      expect(result.uniqueVoters).toBe(15);
      expect(result.participationRate).toBe(75);
      expect(result.options).toHaveLength(2);
      expect(result.options[0].label).toBe('Winner');
      expect(result.options[0].votesCount).toBe(12);
    });
  });
});
