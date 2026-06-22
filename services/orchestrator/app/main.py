from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agents import ORG_CHART
from config import settings
from schemas import (
    AgentBlueprint,
    AgentStateCreate,
    AgentStateRead,
    ArtistCreate,
    ArtistRead,
    ContractCreate,
    ContractRead,
    DatabaseBlueprintResponse,
    DatabaseTableBlueprint,
    HealthResponse,
    TrackCreate,
    TrackRead
)

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description=(
        "Foundational orchestration API for the autonomous record label platform. "
        "This phase focuses on typed schema contracts, org-chart metadata, and "
        "database-first service entry points."
    )
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
def list_artists() -> list[ArtistRead]:
    return []


@app.post(
    f"{settings.api_prefix}/artists/intake-preview",
    response_model=ArtistCreate,
    tags=["artists"]
)
def preview_artist_intake(payload: ArtistCreate) -> ArtistCreate:
    return payload


@app.get(f"{settings.api_prefix}/tracks", response_model=list[TrackRead], tags=["tracks"])
def list_tracks() -> list[TrackRead]:
    return []


@app.post(
    f"{settings.api_prefix}/tracks/intake-preview",
    response_model=TrackCreate,
    tags=["tracks"]
)
def preview_track_intake(payload: TrackCreate) -> TrackCreate:
    return payload


@app.get(f"{settings.api_prefix}/contracts", response_model=list[ContractRead], tags=["contracts"])
def list_contracts() -> list[ContractRead]:
    return []


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
def list_agent_states() -> list[AgentStateRead]:
    return []


@app.post(
    f"{settings.api_prefix}/agent-states/intake-preview",
    response_model=AgentStateCreate,
    tags=["agent-states"]
)
def preview_agent_state_intake(payload: AgentStateCreate) -> AgentStateCreate:
    return payload
