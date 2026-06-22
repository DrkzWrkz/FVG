from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, DateTime, ForeignKey, Numeric, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


JSON_TYPE = JSON().with_variant(JSONB, "postgresql")
EMBEDDING_TYPE = JSON().with_variant(Vector(1536), "postgresql")


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Artist(Base):
    __tablename__ = "artists"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    profile: Mapped[dict[str, Any]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=dict
    )
    budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0.00"))
    accrued_royalties: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00")
    )
    unrecouped_advance: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow
    )


class Track(Base):
    __tablename__ = "tracks"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    artist_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("artists.id", ondelete="SET NULL")
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    isrc: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    metadata_tags: Mapped[dict[str, Any]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=dict
    )
    acoustic_features: Mapped[dict[str, Any]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=dict
    )
    audio_url: Mapped[str] = mapped_column(Text, nullable=False)
    semantic_embedding: Mapped[list[float] | None] = mapped_column(EMBEDDING_TYPE, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow
    )


class Contract(Base):
    __tablename__ = "contracts"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    artist_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("artists.id", ondelete="CASCADE")
    )
    track_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("tracks.id", ondelete="SET NULL")
    )
    split_percentages: Mapped[dict[str, Any]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=dict
    )
    advance_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=Decimal("0.00")
    )
    recoupment_rate: Mapped[Decimal] = mapped_column(
        Numeric(6, 5),
        nullable=False,
        default=Decimal("0.00000")
    )
    legal_status: Mapped[str] = mapped_column(Text, nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow
    )


class AgentState(Base):
    __tablename__ = "agent_states"

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    agent_name: Mapped[str] = mapped_column(Text, nullable=False)
    thread_id: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    entity_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), nullable=True)
    conversation_thread: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=list
    )
    graph_history: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=list
    )
    tool_execution_logs: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON_TYPE,
        nullable=False,
        default=list
    )
    state_status: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="initialized"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow
    )
