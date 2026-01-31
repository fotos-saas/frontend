import {
  Poll,
  PollOption,
  PollMedia,
  PollResults,
  ApiPollResponse,
  ApiPollOptionResponse,
  ApiPollMediaResponse,
  ApiResultsResponse
} from '../models/voting.models';

/**
 * Vote Mappers
 *
 * API válasz mapping helper-ek szavazásokhoz:
 * - Poll API mapping
 * - PollOption API mapping
 * - PollResults API mapping
 */

/**
 * API válasz mapping PollMedia-ra
 */
export function mapMediaFromApi(media: ApiPollMediaResponse): PollMedia {
  return {
    id: media.id,
    url: media.url,
    fileName: media.fileName,
    sortOrder: media.sortOrder
  };
}

/**
 * API válasz mapping Poll-ra
 */
export function mapPollFromApi(data: ApiPollResponse): Poll {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    coverImageUrl: data.cover_image_url,
    media: (data.media || []).map(mapMediaFromApi),
    type: data.type,
    isActive: data.is_active,
    isMultipleChoice: data.is_multiple_choice,
    maxVotesPerGuest: data.max_votes_per_guest,
    showResultsBeforeVote: data.show_results_before_vote,
    useForFinalization: data.use_for_finalization,
    closeAt: data.close_at,
    isOpen: data.is_open,
    canVote: data.can_vote,
    myVotes: data.my_votes || [],
    totalVotes: data.total_votes,
    uniqueVoters: data.unique_voters,
    optionsCount: data.options_count,
    options: data.options?.map(mapOptionFromApi),
    participationRate: data.participation_rate,
    createdAt: data.created_at
  };
}

/**
 * API válasz mapping PollOption-ra
 */
export function mapOptionFromApi(opt: ApiPollOptionResponse): PollOption {
  return {
    id: opt.id,
    label: opt.label,
    description: opt.description,
    imageUrl: opt.image_url,
    templateId: opt.template_id,
    templateName: opt.template_name ?? null,
    votesCount: opt.votes_count,
    percentage: opt.percentage
  };
}

/**
 * API válasz mapping PollResults-ra
 */
export function mapResultsFromApi(data: ApiResultsResponse): PollResults {
  return {
    pollId: data.poll_id,
    title: data.title,
    isOpen: data.is_open,
    totalVotes: data.total_votes,
    uniqueVoters: data.unique_voters,
    participationRate: data.participation_rate,
    options: data.options.map(mapOptionFromApi)
  };
}
