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
    copy: str
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
