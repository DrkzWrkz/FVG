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

export interface AgentStateEvent {
  timestamp?: string;
  direction?: string;
  payload?: unknown;
}

export interface AgentStateLog {
  timestamp?: string;
  tool?: string;
  status?: string;
  agent_name?: string;
  step?: string;
  thread_id?: string;
}

export interface AgentStateRead {
  id: string;
  agent_name: string;
  thread_id: string;
  entity_type: string;
  entity_id: string | null;
  conversation_thread: AgentStateEvent[];
  graph_history: AgentStateLog[];
  tool_execution_logs: AgentStateLog[];
  state_status: string;
  created_at: string;
  updated_at: string;
}

export interface AgentStateHistorySummary {
  id: string;
  agent_name: string;
  thread_id: string;
  entity_type: string;
  entity_id: string | null;
  state_status: string;
  created_at: string;
  updated_at: string;
  conversation_event_count: number;
  graph_step_count: number;
  tool_execution_count: number;
  latest_tool: string | null;
  latest_output_preview: unknown;
}

export interface SplitSheetLineItem {
  party_name: string;
  role: string;
  ownership_percent: string;
  recoupable: boolean;
  contact_email: string | null;
}

export interface LegalRoyaltyRequest {
  artist_name: string;
  track_title: string;
  contract_reference?: string | null;
  split_sheet: SplitSheetLineItem[];
  gross_revenue: string;
  royalty_pool_rate: string;
  distribution_fee_rate: string;
  advance_amount: string;
  prior_unrecouped_balance: string;
  recoupment_rate: string;
  persist_state: boolean;
  thread_id?: string | null;
}

export interface SplitSheetValidationIssue {
  severity: string;
  message: string;
}

export interface NormalizedSplitLineItem {
  party_name: string;
  role: string;
  declared_ownership_percent: string;
  normalized_ownership_percent: string;
  recoupable: boolean;
  contact_email: string | null;
}

export interface SplitSheetAnalysis {
  total_declared_percent: string;
  normalized_split_sheet: NormalizedSplitLineItem[];
  duplicate_parties: string[];
  validation_issues: SplitSheetValidationIssue[];
  requires_human_review: boolean;
  recoupable_party_count: number;
}

export interface ParticipantRecoupmentPayout {
  party_name: string;
  role: string;
  ownership_percent: string;
  pre_recoupment_amount: string;
  recoupment_withheld_amount: string;
  payout_amount: string;
  recoupable: boolean;
}

export interface RecoupmentModel {
  gross_revenue: string;
  distribution_fee_amount: string;
  net_receipts: string;
  royalty_pool_amount: string;
  total_recoupable_balance: string;
  recoupment_withheld: string;
  remaining_unrecouped_balance: string;
  total_distributable_amount: string;
  participant_payouts: ParticipantRecoupmentPayout[];
}

export interface LegalRoyaltyResponse {
  thread_id: string;
  state_id: string | null;
  artist_name: string;
  track_title: string;
  contract_reference: string | null;
  requires_human_review: boolean;
  legal_summary: string;
  split_sheet_analysis: SplitSheetAnalysis;
  recoupment_model: RecoupmentModel;
  generated_at: string;
}
