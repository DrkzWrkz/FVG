from __future__ import annotations

from datetime import datetime
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


class AgentStateRead(AgentStateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
