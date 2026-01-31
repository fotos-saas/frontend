/**
 * Voting Models
 *
 * Szavazás rendszer interfészei és típusai.
 */

/**
 * Poll media interface - szavazáshoz tartozó képek
 */
export interface PollMedia {
  id: number;
  url: string;
  fileName: string;
  sortOrder: number;
}

/**
 * Poll option interface
 */
export interface PollOption {
  id: number;
  label: string;
  description: string | null;
  imageUrl: string | null;
  templateId: number | null;
  templateName: string | null;
  votesCount?: number;
  percentage?: number;
}

/**
 * Poll interface
 */
export interface Poll {
  id: number;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  media: PollMedia[];
  type: 'template' | 'custom';
  isActive: boolean;
  isMultipleChoice: boolean;
  maxVotesPerGuest: number;
  showResultsBeforeVote: boolean;
  useForFinalization: boolean;
  closeAt: string | null;
  isOpen: boolean;
  canVote?: boolean;
  myVotes: number[];
  totalVotes?: number;
  uniqueVoters?: number;
  optionsCount?: number;
  options?: PollOption[];
  participationRate?: number;
  createdAt: string;
}

/**
 * Poll results interface
 */
export interface PollResults {
  pollId: number;
  title: string;
  isOpen: boolean;
  totalVotes: number;
  uniqueVoters: number;
  participationRate?: number;
  options: PollOption[];
}

/**
 * Vote response interface
 */
export interface VoteResponse {
  success: boolean;
  message: string;
  data?: {
    voteId: number;
    myVotes: number[];
    canVoteMore: boolean;
  };
}

/**
 * Create poll request
 */
export interface CreatePollRequest {
  title: string;
  description?: string;
  type: 'template' | 'custom';
  is_free_choice?: boolean;
  is_multiple_choice?: boolean;
  max_votes_per_guest?: number;
  show_results_before_vote?: boolean;
  use_for_finalization?: boolean;
  close_at?: string;
  options?: CreatePollOption[];
}

/**
 * Create poll option
 */
export interface CreatePollOption {
  label: string;
  description?: string;
  template_id?: number;
  image_url?: string;
}

/**
 * API Poll media response (raw backend format)
 */
export interface ApiPollMediaResponse {
  id: number;
  url: string;
  fileName: string;
  sortOrder: number;
}

/**
 * API Poll response (raw backend format)
 */
export interface ApiPollResponse {
  id: number;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  media?: ApiPollMediaResponse[];
  type: 'template' | 'custom';
  is_active: boolean;
  is_multiple_choice: boolean;
  max_votes_per_guest: number;
  show_results_before_vote: boolean;
  use_for_finalization: boolean;
  close_at: string | null;
  is_open: boolean;
  can_vote?: boolean;
  my_votes?: number[];
  total_votes?: number;
  unique_voters?: number;
  options_count?: number;
  options?: ApiPollOptionResponse[];
  participation_rate?: number;
  created_at: string;
}

/**
 * API Poll option response (raw backend format)
 */
export interface ApiPollOptionResponse {
  id: number;
  label: string;
  description: string | null;
  image_url: string | null;
  template_id: number | null;
  template_name?: string | null;
  votes_count?: number;
  percentage?: number;
}

/**
 * API Results response (raw backend format)
 */
export interface ApiResultsResponse {
  poll_id: number;
  title: string;
  is_open: boolean;
  total_votes: number;
  unique_voters: number;
  participation_rate?: number;
  options: ApiPollOptionResponse[];
}
