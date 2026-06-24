from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str
    timestamp: datetime


class AgentBlueprint(BaseModel):
    id: str
    name: str
    workflow_style: str
    status: str
    core_logic: str
    responsibilities: list[str]
    planned_tools: list[str]


class DatabaseTableBlueprint(BaseModel):
    name: str
    primary_purpose: str
    notable_fields: list[str]


class DatabaseBlueprintResponse(BaseModel):
    engine: str
    vector_layer: str
    tables: list[DatabaseTableBlueprint]


class ArtistBase(BaseModel):
    name: str
    profile: dict[str, Any] = Field(default_factory=dict)
    budget: Decimal = Decimal("0.00")
    accrued_royalties: Decimal = Decimal("0.00")
    unrecouped_advance: Decimal = Decimal("0.00")


class ArtistCreate(ArtistBase):
    pass


class ArtistUpdate(BaseModel):
    name: str | None = None
    profile: dict[str, Any] | None = None
    budget: Decimal | None = None
    accrued_royalties: Decimal | None = None
    unrecouped_advance: Decimal | None = None


class ArtistRead(ArtistBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TrackBase(BaseModel):
    artist_id: UUID | None = None
    title: str
    isrc: str
    metadata_tags: dict[str, Any] = Field(default_factory=dict)
    acoustic_features: dict[str, Any] = Field(default_factory=dict)
    audio_url: str


class TrackCreate(TrackBase):
    pass


class TrackUpdate(BaseModel):
    artist_id: UUID | None = None
    title: str | None = None
    isrc: str | None = None
    metadata_tags: dict[str, Any] | None = None
    acoustic_features: dict[str, Any] | None = None
    audio_url: str | None = None


class TrackRead(TrackBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContractBase(BaseModel):
    artist_id: UUID | None = None
    track_id: UUID | None = None
    split_percentages: dict[str, Any] = Field(default_factory=dict)
    advance_amount: Decimal = Decimal("0.00")
    recoupment_rate: Decimal = Decimal("0.00000")
    legal_status: str = "draft"


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    artist_id: UUID | None = None
    track_id: UUID | None = None
    split_percentages: dict[str, Any] | None = None
    advance_amount: Decimal | None = None
    recoupment_rate: Decimal | None = None
    legal_status: str | None = None


class ContractRead(ContractBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentStateBase(BaseModel):
    agent_name: str
    thread_id: str
    entity_type: str
    entity_id: UUID | None = None
    conversation_thread: list[dict[str, Any]] = Field(default_factory=list)
    graph_history: list[dict[str, Any]] = Field(default_factory=list)
    tool_execution_logs: list[dict[str, Any]] = Field(default_factory=list)
    state_status: str = "initialized"


class AgentStateCreate(AgentStateBase):
    pass


class AgentStateUpdate(BaseModel):
    agent_name: str | None = None
    thread_id: str | None = None
    entity_type: str | None = None
    entity_id: UUID | None = None
    conversation_thread: list[dict[str, Any]] | None = None
    graph_history: list[dict[str, Any]] | None = None
    tool_execution_logs: list[dict[str, Any]] | None = None
    state_status: str | None = None


class AgentStateRead(AgentStateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentStateHistorySummary(BaseModel):
    id: UUID
    agent_name: str
    thread_id: str
    entity_type: str
    entity_id: UUID | None = None
    state_status: str
    created_at: datetime
    updated_at: datetime
    conversation_event_count: int
    graph_step_count: int
    tool_execution_count: int
    latest_tool: str | None = None
    latest_output_preview: Any | None = None


class DiscoveryCandidate(BaseModel):
    artist_name: str
    track_title: str
    unreleased: bool = True
    primary_genre: str
    mood: str
    bpm: int = Field(ge=40, le=220)
    growth_points_gx: float = Field(ge=0, le=100)
    engagement_points_ix: float = Field(ge=0, le=100)
    cross_platform_mentions: int = Field(ge=0)
    save_rate: float = Field(ge=0, le=1)
    completion_rate: float = Field(ge=0, le=1)
    target_similarity: float = Field(ge=0, le=1)
    markets: list[str] = Field(default_factory=list)


class DiscoveryScanRequest(BaseModel):
    label_priority_genres: list[str] = Field(default_factory=list)
    candidates: list[DiscoveryCandidate]
    minimum_score: float = Field(default=70, ge=0, le=100)
    persist_state: bool = False
    thread_id: str | None = None


class DiscoverySignalBreakdown(BaseModel):
    growth_score: float
    engagement_score: float
    acoustic_match_score: float
    platform_traction_score: float
    total_score: float


class DiscoveryOpportunity(BaseModel):
    artist_name: str
    track_title: str
    flagged: bool
    score_band: str
    markets: list[str]
    signal_breakdown: DiscoverySignalBreakdown
    rationale: list[str]


class DiscoveryScanResponse(BaseModel):
    thread_id: str
    state_id: UUID | None = None
    reviewed_assets_count: int
    flagged_assets: list[DiscoveryOpportunity]
    watchlist_assets: list[DiscoveryOpportunity]
    generated_at: datetime


class ReleaseStrategyRequest(BaseModel):
    artist_name: str
    track_title: str
    genre: str
    mood: str
    bpm: int = Field(ge=40, le=220)
    release_date: date | None = None
    campaign_objective: str = "Grow pre-saves, launch-day streams, and post-release retention."
    target_audience: str = "Independent music fans likely to engage with discovery-first campaigns."
    primary_platforms: list[str] = Field(
        default_factory=lambda: ["TikTok", "Instagram Reels", "Spotify"]
    )
    persist_state: bool = False
    thread_id: str | None = None


class SocialScheduleItem(BaseModel):
    week_number: int
    day_label: str
    channel: str
    objective: str
    caption: str
    asset_prompt: str


class PitchingCopyItem(BaseModel):
    recipient_type: str
    subject_line: str
    body: str


class FanEmailItem(BaseModel):
    send_window: str
    subject_line: str
    preview_text: str
    body_summary: str
    call_to_action: str


class ReleaseWeekPlan(BaseModel):
    week_number: int
    phase: str
    date_anchor: str
    strategic_focus: str
    social_schedule: list[SocialScheduleItem]
    pitching_copy: list[PitchingCopyItem]
    fan_email_sequence: list[FanEmailItem]


class ReleaseStrategyResponse(BaseModel):
    thread_id: str
    state_id: UUID | None = None
    artist_name: str
    track_title: str
    campaign_summary: str
    release_timeline: list[ReleaseWeekPlan]
    generated_at: datetime


class MarketingCrewRequest(BaseModel):
    artist_name: str
    track_title: str
    genre: str
    mood: str
    bpm: int = Field(ge=40, le=220)
    campaign_objective: str
    target_audience: str
    comparison_artists: list[str] = Field(default_factory=list)
    differentiators: list[str] = Field(default_factory=list)
    priority_markets: list[str] = Field(default_factory=list)
    persist_state: bool = False
    thread_id: str | None = None


class AudienceSegment(BaseModel):
    name: str
    age_range: str
    platforms: list[str]
    motivations: list[str]


class MarketResearchOutput(BaseModel):
    audience_segments: list[AudienceSegment]
    trending_keywords: list[str]
    regional_priorities: list[str]
    positioning_notes: list[str]


class PressKitOutput(BaseModel):
    headline: str
    artist_bio: str
    press_angle: str
    talking_points: list[str]


class CanvasPromptOutput(BaseModel):
    visual_direction: str
    motion_notes: list[str]
    prompt: str


class SocialCopyOutput(BaseModel):
    platform: str
    hook: str
    caption: str
    call_to_action: str


class CopywriterOutput(BaseModel):
    press_kit: PressKitOutput
    canvas_prompt: CanvasPromptOutput
    social_copy: list[SocialCopyOutput]


class MediaMatchOutput(BaseModel):
    outlet_name: str
    editor_role: str
    beat_focus: str
    match_score: float
    rationale: list[str]
    outreach_subject: str
    outreach_pitch: str


class OutreachPlanOutput(BaseModel):
    priority_matches: list[MediaMatchOutput]
    sequencing_notes: list[str]


class MarketingCrewResponse(BaseModel):
    thread_id: str
    state_id: UUID | None = None
    campaign_brief: str
    market_research: MarketResearchOutput
    copywriter_output: CopywriterOutput
    outreach_plan: OutreachPlanOutput
    generated_at: datetime


class SplitSheetLineItem(BaseModel):
    party_name: str
    role: str
    ownership_percent: Decimal = Field(ge=0, le=100)
    recoupable: bool = True
    contact_email: str | None = None


class CopyrightChecklistInput(BaseModel):
    has_human_written_lyrics: bool = True
    has_human_composed_melody: bool = True
    has_human_arranged_structure: bool = True
    ai_generated_lyrics: bool = False
    ai_generated_melody: bool = False
    ai_generated_master_audio: bool = False
    ai_generated_artwork: bool = False
    human_edited_ai_material: bool = False
    source_material_rights_cleared: bool = True
    contributor_agreements_collected: bool = True
    splits_confirmed_by_all_parties: bool = False


class LegalRoyaltyRequest(BaseModel):
    artist_name: str
    track_title: str
    contract_reference: str | None = None
    split_sheet: list[SplitSheetLineItem]
    gross_revenue: Decimal = Decimal("0.00")
    royalty_pool_rate: Decimal = Field(default=Decimal("1.00000"), ge=0, le=1)
    distribution_fee_rate: Decimal = Field(default=Decimal("0.00000"), ge=0, le=1)
    advance_amount: Decimal = Decimal("0.00")
    prior_unrecouped_balance: Decimal = Decimal("0.00")
    recoupment_rate: Decimal = Field(default=Decimal("1.00000"), ge=0, le=1)
    copyright_checklist: CopyrightChecklistInput = Field(default_factory=CopyrightChecklistInput)
    persist_state: bool = False
    thread_id: str | None = None


class SplitSheetValidationIssue(BaseModel):
    severity: str
    message: str


class NormalizedSplitLineItem(BaseModel):
    party_name: str
    role: str
    declared_ownership_percent: Decimal
    normalized_ownership_percent: Decimal
    recoupable: bool
    contact_email: str | None = None


class SplitSheetAnalysis(BaseModel):
    total_declared_percent: Decimal
    normalized_split_sheet: list[NormalizedSplitLineItem]
    duplicate_parties: list[str]
    validation_issues: list[SplitSheetValidationIssue]
    requires_human_review: bool
    recoupable_party_count: int


class ParticipantRecoupmentPayout(BaseModel):
    party_name: str
    role: str
    ownership_percent: Decimal
    pre_recoupment_amount: Decimal
    recoupment_withheld_amount: Decimal
    payout_amount: Decimal
    recoupable: bool


class RecoupmentModel(BaseModel):
    gross_revenue: Decimal
    distribution_fee_amount: Decimal
    net_receipts: Decimal
    royalty_pool_amount: Decimal
    total_recoupable_balance: Decimal
    recoupment_withheld: Decimal
    remaining_unrecouped_balance: Decimal
    total_distributable_amount: Decimal
    participant_payouts: list[ParticipantRecoupmentPayout]


class CopyrightChecklistFinding(BaseModel):
    criterion: str
    passed: bool
    severity: str
    message: str


class CopyrightEligibilityAnalysis(BaseModel):
    eligibility_status: str
    requires_human_review: bool
    ai_disclosure_required: bool
    checklist_findings: list[CopyrightChecklistFinding]
    filing_guidance: list[str]


class LegalApprovalCheckpointRequest(BaseModel):
    decision: str
    reviewer_name: str
    reviewer_role: str
    notes: str


class LegalApprovalCheckpointResponse(BaseModel):
    state_id: UUID
    thread_id: str
    previous_status: str
    new_status: str
    reviewer_name: str
    reviewer_role: str
    notes: str
    recorded_at: datetime


class LegalDocumentExtractionData(BaseModel):
    artist_name: str
    track_title: str
    contract_reference: str | None = None
    split_sheet: list[SplitSheetLineItem]
    gross_revenue: Decimal
    royalty_pool_rate: Decimal
    distribution_fee_rate: Decimal
    advance_amount: Decimal
    prior_unrecouped_balance: Decimal
    recoupment_rate: Decimal
    copyright_checklist: CopyrightChecklistInput


class LegalDocumentIngestionAuditPayload(BaseModel):
    source_name: str
    thread_id: str | None = None
    raw_text_excerpt: str
    persist_state: bool = False


class LegalDocumentIngestionResponse(BaseModel):
    thread_id: str
    state_id: UUID | None = None
    source_name: str
    extracted_data: LegalDocumentExtractionData
    extraction_issues: list[str]
    missing_fields: list[str]
    requires_human_review: bool
    generated_at: datetime


class LegalRoyaltyResponse(BaseModel):
    thread_id: str
    state_id: UUID | None = None
    artist_name: str
    track_title: str
    contract_reference: str | None = None
    requires_human_review: bool
    legal_summary: str
    split_sheet_analysis: SplitSheetAnalysis
    recoupment_model: RecoupmentModel
    copyright_eligibility: CopyrightEligibilityAnalysis
    generated_at: datetime
