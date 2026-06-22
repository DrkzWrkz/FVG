from contextlib import asynccontextmanager
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from agents import ORG_CHART
from agents.ar_discovery import run_discovery_scan
from agents.virtual_manager import build_release_strategy
from config import settings
from crud import (
    apply_updates,
    delete_record,
    ensure_artist_exists,
    ensure_track_exists,
    get_agent_state_by_thread,
    get_record_or_404,
    list_records,
    persist_agent_workflow_state,
    save_record,
    validate_split_percentages
)
from database import get_db, initialize_database
from models import AgentState, Artist, Contract, Track
from schemas import (
    AgentBlueprint,
    AgentStateCreate,
    AgentStateRead,
    AgentStateUpdate,
    ArtistCreate,
    ArtistRead,
    ArtistUpdate,
    ContractCreate,
    ContractRead,
    ContractUpdate,
    DatabaseBlueprintResponse,
    DatabaseTableBlueprint,
    DiscoveryScanRequest,
    DiscoveryScanResponse,
    HealthResponse,
    ReleaseStrategyRequest,
    ReleaseStrategyResponse,
    TrackCreate,
    TrackRead,
    TrackUpdate
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_database()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Foundational orchestration API for the autonomous record label platform. "
        "This phase focuses on typed schema contracts, org-chart metadata, and "
        "database-first service entry points."
    ),
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/", tags=["system"])
def root() -> dict[str, str]:
    return {
        "message": "Autonomous Record Label Orchestrator",
        "docs": "/docs"
    }


@app.get("/healthz", response_model=HealthResponse, tags=["system"])
def healthcheck() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.environment,
        timestamp=datetime.now(timezone.utc)
    )


@app.get(
    f"{settings.api_prefix}/agents/org-chart",
    response_model=list[AgentBlueprint],
    tags=["agents"]
)
def get_org_chart() -> list[AgentBlueprint]:
    return [AgentBlueprint.model_validate(agent) for agent in ORG_CHART]


@app.get(
    f"{settings.api_prefix}/foundation/database",
    response_model=DatabaseBlueprintResponse,
    tags=["foundation"]
)
def get_database_blueprint() -> DatabaseBlueprintResponse:
    return DatabaseBlueprintResponse(
        engine=settings.database_url.split("://", maxsplit=1)[0],
        vector_layer="pgvector primary, Qdrant-ready secondary memory service",
        tables=[
            DatabaseTableBlueprint(
                name="artists",
                primary_purpose="Artist profile, budget, royalties, and advance state.",
                notable_fields=["profile", "budget", "accrued_royalties", "unrecouped_advance"]
            ),
            DatabaseTableBlueprint(
                name="tracks",
                primary_purpose="DDEX-style metadata, acoustic features, and audio asset references.",
                notable_fields=["isrc", "metadata_tags", "acoustic_features", "audio_url"]
            ),
            DatabaseTableBlueprint(
                name="contracts",
                primary_purpose="Split ownership, advances, recoupment, and legal workflow state.",
                notable_fields=["split_percentages", "advance_amount", "recoupment_rate", "legal_status"]
            ),
            DatabaseTableBlueprint(
                name="agent_states",
                primary_purpose="Persistent memory for agent threads, graph history, and tool logs.",
                notable_fields=["conversation_thread", "graph_history", "tool_execution_logs", "state_status"]
            )
        ]
    )


@app.get(f"{settings.api_prefix}/artists", response_model=list[ArtistRead], tags=["artists"])
def list_artists(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
) -> list[Artist]:
    return list_records(db, Artist, offset=offset, limit=limit)


@app.post(
    f"{settings.api_prefix}/artists",
    response_model=ArtistRead,
    status_code=status.HTTP_201_CREATED,
    tags=["artists"]
)
def create_artist(payload: ArtistCreate, db: Session = Depends(get_db)) -> Artist:
    artist = Artist(**payload.model_dump())
    return save_record(db, artist, conflict_message="Unable to create artist record.")


@app.get(
    f"{settings.api_prefix}/artists/{{artist_id}}",
    response_model=ArtistRead,
    tags=["artists"]
)
def get_artist(artist_id: UUID, db: Session = Depends(get_db)) -> Artist:
    return get_record_or_404(db, Artist, artist_id, "Artist")


@app.patch(
    f"{settings.api_prefix}/artists/{{artist_id}}",
    response_model=ArtistRead,
    tags=["artists"]
)
def update_artist(
    artist_id: UUID,
    payload: ArtistUpdate,
    db: Session = Depends(get_db)
) -> Artist:
    artist = get_record_or_404(db, Artist, artist_id, "Artist")
    apply_updates(artist, payload)
    return save_record(db, artist, conflict_message="Unable to update artist record.")


@app.delete(
    f"{settings.api_prefix}/artists/{{artist_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["artists"]
)
def delete_artist(artist_id: UUID, db: Session = Depends(get_db)) -> Response:
    artist = get_record_or_404(db, Artist, artist_id, "Artist")
    delete_record(db, artist)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    f"{settings.api_prefix}/artists/intake-preview",
    response_model=ArtistCreate,
    tags=["artists"]
)
def preview_artist_intake(payload: ArtistCreate) -> ArtistCreate:
    return payload


@app.get(f"{settings.api_prefix}/tracks", response_model=list[TrackRead], tags=["tracks"])
def list_tracks(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
) -> list[Track]:
    return list_records(db, Track, offset=offset, limit=limit)


@app.post(
    f"{settings.api_prefix}/tracks",
    response_model=TrackRead,
    status_code=status.HTTP_201_CREATED,
    tags=["tracks"]
)
def create_track(payload: TrackCreate, db: Session = Depends(get_db)) -> Track:
    ensure_artist_exists(db, payload.artist_id)
    track = Track(**payload.model_dump())
    return save_record(
        db,
        track,
        conflict_message="Unable to create track record. Ensure the ISRC is unique."
    )


@app.get(
    f"{settings.api_prefix}/tracks/{{track_id}}",
    response_model=TrackRead,
    tags=["tracks"]
)
def get_track(track_id: UUID, db: Session = Depends(get_db)) -> Track:
    return get_record_or_404(db, Track, track_id, "Track")


@app.patch(
    f"{settings.api_prefix}/tracks/{{track_id}}",
    response_model=TrackRead,
    tags=["tracks"]
)
def update_track(
    track_id: UUID,
    payload: TrackUpdate,
    db: Session = Depends(get_db)
) -> Track:
    track = get_record_or_404(db, Track, track_id, "Track")
    updates = payload.model_dump(exclude_unset=True)
    ensure_artist_exists(db, updates.get("artist_id"))
    apply_updates(track, payload)
    return save_record(
        db,
        track,
        conflict_message="Unable to update track record. Ensure the ISRC is unique."
    )


@app.delete(
    f"{settings.api_prefix}/tracks/{{track_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["tracks"]
)
def delete_track(track_id: UUID, db: Session = Depends(get_db)) -> Response:
    track = get_record_or_404(db, Track, track_id, "Track")
    delete_record(db, track)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    f"{settings.api_prefix}/tracks/intake-preview",
    response_model=TrackCreate,
    tags=["tracks"]
)
def preview_track_intake(payload: TrackCreate) -> TrackCreate:
    return payload


@app.get(f"{settings.api_prefix}/contracts", response_model=list[ContractRead], tags=["contracts"])
def list_contracts(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
) -> list[Contract]:
    return list_records(db, Contract, offset=offset, limit=limit)


@app.post(
    f"{settings.api_prefix}/contracts",
    response_model=ContractRead,
    status_code=status.HTTP_201_CREATED,
    tags=["contracts"]
)
def create_contract(payload: ContractCreate, db: Session = Depends(get_db)) -> Contract:
    ensure_artist_exists(db, payload.artist_id)
    ensure_track_exists(db, payload.track_id)
    validate_split_percentages(payload.split_percentages, payload.legal_status)
    contract = Contract(**payload.model_dump())
    return save_record(db, contract, conflict_message="Unable to create contract record.")


@app.get(
    f"{settings.api_prefix}/contracts/{{contract_id}}",
    response_model=ContractRead,
    tags=["contracts"]
)
def get_contract(contract_id: UUID, db: Session = Depends(get_db)) -> Contract:
    return get_record_or_404(db, Contract, contract_id, "Contract")


@app.patch(
    f"{settings.api_prefix}/contracts/{{contract_id}}",
    response_model=ContractRead,
    tags=["contracts"]
)
def update_contract(
    contract_id: UUID,
    payload: ContractUpdate,
    db: Session = Depends(get_db)
) -> Contract:
    contract = get_record_or_404(db, Contract, contract_id, "Contract")
    updates = payload.model_dump(exclude_unset=True)
    ensure_artist_exists(db, updates.get("artist_id", contract.artist_id))
    ensure_track_exists(db, updates.get("track_id", contract.track_id))
    validate_split_percentages(
        updates.get("split_percentages", contract.split_percentages),
        updates.get("legal_status", contract.legal_status)
    )
    apply_updates(contract, payload)
    return save_record(db, contract, conflict_message="Unable to update contract record.")


@app.delete(
    f"{settings.api_prefix}/contracts/{{contract_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["contracts"]
)
def delete_contract(contract_id: UUID, db: Session = Depends(get_db)) -> Response:
    contract = get_record_or_404(db, Contract, contract_id, "Contract")
    delete_record(db, contract)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    f"{settings.api_prefix}/contracts/intake-preview",
    response_model=ContractCreate,
    tags=["contracts"]
)
def preview_contract_intake(payload: ContractCreate) -> ContractCreate:
    return payload


@app.get(
    f"{settings.api_prefix}/agent-states",
    response_model=list[AgentStateRead],
    tags=["agent-states"]
)
def list_agent_states(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db)
) -> list[AgentState]:
    return list_records(db, AgentState, offset=offset, limit=limit)


@app.post(
    f"{settings.api_prefix}/agent-states",
    response_model=AgentStateRead,
    status_code=status.HTTP_201_CREATED,
    tags=["agent-states"]
)
def create_agent_state(payload: AgentStateCreate, db: Session = Depends(get_db)) -> AgentState:
    agent_state = AgentState(**payload.model_dump())
    return save_record(db, agent_state, conflict_message="Unable to create agent state record.")


@app.get(
    f"{settings.api_prefix}/agent-states/{{state_id}}",
    response_model=AgentStateRead,
    tags=["agent-states"]
)
def get_agent_state(state_id: UUID, db: Session = Depends(get_db)) -> AgentState:
    return get_record_or_404(db, AgentState, state_id, "Agent state")


@app.patch(
    f"{settings.api_prefix}/agent-states/{{state_id}}",
    response_model=AgentStateRead,
    tags=["agent-states"]
)
def update_agent_state(
    state_id: UUID,
    payload: AgentStateUpdate,
    db: Session = Depends(get_db)
) -> AgentState:
    agent_state = get_record_or_404(db, AgentState, state_id, "Agent state")
    apply_updates(agent_state, payload)
    return save_record(db, agent_state, conflict_message="Unable to update agent state record.")


@app.delete(
    f"{settings.api_prefix}/agent-states/{{state_id}}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["agent-states"]
)
def delete_agent_state(state_id: UUID, db: Session = Depends(get_db)) -> Response:
    agent_state = get_record_or_404(db, AgentState, state_id, "Agent state")
    delete_record(db, agent_state)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    f"{settings.api_prefix}/agent-states/intake-preview",
    response_model=AgentStateCreate,
    tags=["agent-states"]
)
def preview_agent_state_intake(payload: AgentStateCreate) -> AgentStateCreate:
    return payload


@app.post(
    f"{settings.api_prefix}/agents/ar-discovery/scan",
    response_model=DiscoveryScanResponse,
    tags=["agents"]
)
def execute_ar_discovery(
    payload: DiscoveryScanRequest,
    db: Session = Depends(get_db)
) -> DiscoveryScanResponse:
    result = run_discovery_scan(payload)

    if payload.persist_state:
        state = persist_agent_workflow_state(
            db,
            agent_name="ar-discovery",
            thread_id=result.thread_id,
            entity_type="discovery-scan",
            payload=payload,
            result=result,
            tool_name="mock-streaming-telemetry"
        )
        result.state_id = state.id

    return result


@app.get(
    f"{settings.api_prefix}/agents/ar-discovery/threads/{{thread_id}}",
    response_model=AgentStateRead,
    tags=["agents"]
)
def get_ar_discovery_thread(thread_id: str, db: Session = Depends(get_db)) -> AgentState:
    state = get_agent_state_by_thread(db, agent_name="ar-discovery", thread_id=thread_id)
    if state is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent state not found.")
    return state


@app.post(
    f"{settings.api_prefix}/agents/virtual-manager/release-plan",
    response_model=ReleaseStrategyResponse,
    tags=["agents"]
)
def execute_virtual_manager(
    payload: ReleaseStrategyRequest,
    db: Session = Depends(get_db)
) -> ReleaseStrategyResponse:
    result = build_release_strategy(payload)

    if payload.persist_state:
        state = persist_agent_workflow_state(
            db,
            agent_name="virtual-manager",
            thread_id=result.thread_id,
            entity_type="release-strategy",
            payload=payload,
            result=result,
            tool_name="release-calendar-generator"
        )
        result.state_id = state.id

    return result


@app.get(
    f"{settings.api_prefix}/agents/virtual-manager/threads/{{thread_id}}",
    response_model=AgentStateRead,
    tags=["agents"]
)
def get_virtual_manager_thread(thread_id: str, db: Session = Depends(get_db)) -> AgentState:
    state = get_agent_state_by_thread(db, agent_name="virtual-manager", thread_id=thread_id)
    if state is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent state not found.")
    return state
