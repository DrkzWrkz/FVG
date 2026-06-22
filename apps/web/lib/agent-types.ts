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

export interface MarketingCrewRequest {
  artist_name: string;
  track_title: string;
  genre: string;
  mood: string;
  bpm: number;
  campaign_objective: string;
  target_audience: string;
  comparison_artists: string[];
  differentiators: string[];
  priority_markets: string[];
  persist_state: boolean;
  thread_id?: string | null;
}

export interface AudienceSegment {
  name: string;
  age_range: string;
  platforms: string[];
  motivations: string[];
}

export interface MarketResearchOutput {
  audience_segments: AudienceSegment[];
  trending_keywords: string[];
  regional_priorities: string[];
  positioning_notes: string[];
}

export interface PressKitOutput {
  headline: string;
  artist_bio: string;
  press_angle: string;
  talking_points: string[];
}

export interface CanvasPromptOutput {
  visual_direction: string;
  motion_notes: string[];
  prompt: string;
}

export interface SocialCopyOutput {
  platform: string;
  hook: string;
  caption: string;
  call_to_action: string;
}

export interface CopywriterOutput {
  press_kit: PressKitOutput;
  canvas_prompt: CanvasPromptOutput;
  social_copy: SocialCopyOutput[];
}

export interface MediaMatchOutput {
  outlet_name: string;
  editor_role: string;
  beat_focus: string;
  match_score: number;
  rationale: string[];
  outreach_subject: string;
  outreach_pitch: string;
}

export interface OutreachPlanOutput {
  priority_matches: MediaMatchOutput[];
  sequencing_notes: string[];
}

export interface MarketingCrewResponse {
  thread_id: string;
  state_id: string | null;
  campaign_brief: string;
  market_research: MarketResearchOutput;
  copywriter_output: CopywriterOutput;
  outreach_plan: OutreachPlanOutput;
  generated_at: string;
}
