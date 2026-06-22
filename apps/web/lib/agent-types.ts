export interface DiscoveryCandidate {
  artist_name: string;
  track_title: string;
  unreleased: boolean;
  primary_genre: string;
  mood: string;
  bpm: number;
  growth_points_gx: number;
  engagement_points_ix: number;
  cross_platform_mentions: number;
  save_rate: number;
  completion_rate: number;
  target_similarity: number;
  markets: string[];
}

export interface DiscoveryScanRequest {
  label_priority_genres: string[];
  candidates: DiscoveryCandidate[];
  minimum_score: number;
  persist_state: boolean;
  thread_id?: string | null;
}

export interface DiscoveryOpportunity {
  artist_name: string;
  track_title: string;
  flagged: boolean;
  score_band: string;
  markets: string[];
  signal_breakdown: {
    growth_score: number;
    engagement_score: number;
    acoustic_match_score: number;
    platform_traction_score: number;
    total_score: number;
  };
  rationale: string[];
}

export interface DiscoveryScanResponse {
  thread_id: string;
  state_id: string | null;
  reviewed_assets_count: number;
  flagged_assets: DiscoveryOpportunity[];
  watchlist_assets: DiscoveryOpportunity[];
  generated_at: string;
}

export interface ReleaseStrategyRequest {
  artist_name: string;
  track_title: string;
  genre: string;
  mood: string;
  bpm: number;
  release_date?: string | null;
  campaign_objective: string;
  target_audience: string;
  primary_platforms: string[];
  persist_state: boolean;
  thread_id?: string | null;
}

export interface SocialScheduleItem {
  week_number: number;
  day_label: string;
  channel: string;
  objective: string;
  caption: string;
  asset_prompt: string;
}

export interface PitchingCopyItem {
  recipient_type: string;
  subject_line: string;
  body: string;
}

export interface FanEmailItem {
  send_window: string;
  subject_line: string;
  preview_text: string;
  body_summary: string;
  call_to_action: string;
}

export interface ReleaseWeekPlan {
  week_number: number;
  phase: string;
  date_anchor: string;
  strategic_focus: string;
  social_schedule: SocialScheduleItem[];
  pitching_copy: PitchingCopyItem[];
  fan_email_sequence: FanEmailItem[];
}

export interface ReleaseStrategyResponse {
  thread_id: string;
  state_id: string | null;
  artist_name: string;
  track_title: string;
  campaign_summary: string;
  release_timeline: ReleaseWeekPlan[];
  generated_at: string;
}
