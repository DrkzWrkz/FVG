from __future__ import annotations

from collections.abc import Mapping
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any
from uuid import UUID

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import AgentState, Artist, Contract, Track


def list_records(db: Session, model: type, offset: int = 0, limit: int = 50) -> list[Any]:
    statement = (
        select(model)
        .order_by(model.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(statement).all())


def list_agent_states_filtered(
    db: Session,
    *,
    offset: int = 0,
    limit: int = 50,
    agent_name: str | None = None,
    state_status: str | None = None,
    entity_type: str | None = None,
    thread_id: str | None = None
) -> list[AgentState]:
    statement = select(AgentState)

    if agent_name:
        statement = statement.where(AgentState.agent_name == agent_name)
    if state_status:
        statement = statement.where(AgentState.state_status == state_status)
    if entity_type:
        statement = statement.where(AgentState.entity_type == entity_type)
    if thread_id:
        statement = statement.where(AgentState.thread_id == thread_id)

    statement = (
        statement
        .order_by(AgentState.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def get_record_or_404(db: Session, model: type, record_id: UUID, resource_name: str) -> Any:
    record = db.get(model, record_id)
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource_name} not found."
        )
    return record


def save_record(db: Session, record: Any, conflict_message: str) -> Any:
    db.add(record)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=conflict_message
        ) from exc

    db.refresh(record)
    return record


def delete_record(db: Session, record: Any) -> None:
    db.delete(record)
    db.commit()


def apply_updates(record: Any, payload: BaseModel) -> Any:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    return record


def ensure_artist_exists(db: Session, artist_id: UUID | None) -> None:
    if artist_id is None:
        return

    if db.get(Artist, artist_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced artist not found."
        )


def ensure_track_exists(db: Session, track_id: UUID | None) -> None:
    if track_id is None:
        return

    if db.get(Track, track_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced track not found."
        )


def validate_split_percentages(
    split_percentages: Mapping[str, object],
    legal_status: str
) -> Decimal:
    if not split_percentages:
        if legal_status.lower() == "draft":
            return Decimal("0.00000")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="split_percentages must contain at least one participant."
        )

    running_total = Decimal("0")

    for participant, raw_value in split_percentages.items():
        try:
            numeric_value = Decimal(str(raw_value))
        except InvalidOperation as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Split percentage for '{participant}' must be numeric."
            ) from exc

        if numeric_value < 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Split percentage for '{participant}' cannot be negative."
            )

        running_total += numeric_value

    if running_total > Decimal("100"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Split percentages cannot exceed 100 percent."
        )

    finalizing_statuses = {"active", "executed", "approved"}
    if legal_status.lower() in finalizing_statuses and running_total != Decimal("100"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Active or executed contracts must total exactly 100 percent."
        )

    return running_total.quantize(Decimal("0.00001"))


def get_agent_state_by_thread(
    db: Session,
    agent_name: str,
    thread_id: str
) -> AgentState | None:
    statement = select(AgentState).where(
        AgentState.agent_name == agent_name,
        AgentState.thread_id == thread_id
    )
    return db.scalar(statement)


def get_latest_output_payload(state: AgentState) -> Any | None:
    for event in reversed(state.conversation_thread or []):
        if event.get("direction") == "output":
            return event.get("payload")
    return None


def append_agent_state_checkpoint(
    db: Session,
    state: AgentState,
    *,
    payload: dict[str, Any],
    new_status: str,
    tool_name: str = "human-approval-checkpoint"
) -> AgentState:
    timestamp = datetime.now(timezone.utc).isoformat()
    checkpoint_event = {
        "timestamp": timestamp,
        "direction": "checkpoint",
        "payload": jsonable_encoder(payload)
    }
    graph_event = {
        "timestamp": timestamp,
        "step": tool_name,
        "status": new_status,
        "thread_id": state.thread_id
    }
    tool_log = {
        "timestamp": timestamp,
        "tool": tool_name,
        "status": new_status,
        "agent_name": state.agent_name
    }

    state.conversation_thread = [*(state.conversation_thread or []), checkpoint_event]
    state.graph_history = [*(state.graph_history or []), graph_event]
    state.tool_execution_logs = [*(state.tool_execution_logs or []), tool_log]
    state.state_status = new_status

    return save_record(
        db,
        state,
        conflict_message=f"Unable to append checkpoint for {state.agent_name}."
    )


def persist_agent_workflow_state(
    db: Session,
    *,
    agent_name: str,
    thread_id: str,
    entity_type: str,
    payload: BaseModel,
    result: BaseModel,
    tool_name: str,
    entity_id: UUID | None = None,
    state_status: str = "completed"
) -> AgentState:
    state = get_agent_state_by_thread(db, agent_name=agent_name, thread_id=thread_id)
    timestamp = datetime.now(timezone.utc).isoformat()

    input_event = {
        "timestamp": timestamp,
        "direction": "input",
        "payload": jsonable_encoder(payload.model_dump(mode="json"))
    }
    output_event = {
        "timestamp": timestamp,
        "direction": "output",
        "payload": jsonable_encoder(result.model_dump(mode="json"))
    }
    graph_event = {
        "timestamp": timestamp,
        "step": tool_name,
        "status": state_status,
        "thread_id": thread_id
    }
    tool_log = {
        "timestamp": timestamp,
        "tool": tool_name,
        "status": state_status,
        "agent_name": agent_name
    }

    if state is None:
        state = AgentState(
            agent_name=agent_name,
            thread_id=thread_id,
            entity_type=entity_type,
            entity_id=entity_id,
            conversation_thread=[input_event, output_event],
            graph_history=[graph_event],
            tool_execution_logs=[tool_log],
            state_status=state_status
        )
    else:
        state.entity_type = entity_type
        state.entity_id = entity_id
        state.state_status = state_status
        state.conversation_thread = [
            *(state.conversation_thread or []),
            input_event,
            output_event
        ]
        state.graph_history = [*(state.graph_history or []), graph_event]
        state.tool_execution_logs = [*(state.tool_execution_logs or []), tool_log]

    return save_record(
        db,
        state,
        conflict_message=f"Unable to persist workflow state for {agent_name}."
    )
