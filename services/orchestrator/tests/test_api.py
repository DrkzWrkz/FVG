from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TESTS_DIR = Path(__file__).resolve().parent
APP_DIR = TESTS_DIR.parent / "app"
TEST_DB_PATH = TESTS_DIR / "test_record_label.db"

os.environ["DATABASE_URL"] = f"sqlite+pysqlite:///{TEST_DB_PATH}"
os.environ["DATABASE_AUTO_CREATE"] = "true"

sys.path.insert(0, str(APP_DIR))

from database import Base, engine  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


def test_foundation_crud_workflow():
    with TestClient(app) as client:
        artist_response = client.post(
            "/api/v1/artists",
            json={
                "name": "Nova Bloom",
                "profile": {"country": "US", "genre_focus": ["indie pop"]},
                "budget": "2500.00",
                "accrued_royalties": "0.00",
                "unrecouped_advance": "1500.00"
            }
        )
        assert artist_response.status_code == 201
        artist_id = artist_response.json()["id"]

        list_artists_response = client.get("/api/v1/artists")
        assert list_artists_response.status_code == 200
        assert len(list_artists_response.json()) == 1

        track_response = client.post(
            "/api/v1/tracks",
            json={
                "artist_id": artist_id,
                "title": "Midnight Relay",
                "isrc": "USAAA2600001",
                "metadata_tags": {"ddex": {"title": "Midnight Relay"}},
                "acoustic_features": {"energy": 0.71, "danceability": 0.62},
                "audio_url": "https://cdn.example.com/audio/midnight-relay.wav"
            }
        )
        assert track_response.status_code == 201
        track_id = track_response.json()["id"]

        contract_response = client.post(
            "/api/v1/contracts",
            json={
                "artist_id": artist_id,
                "track_id": track_id,
                "split_percentages": {"artist": 70, "producer": 30},
                "advance_amount": "5000.00",
                "recoupment_rate": "0.50000",
                "legal_status": "active"
            }
        )
        assert contract_response.status_code == 201
        contract_id = contract_response.json()["id"]

        patch_contract_response = client.patch(
            f"/api/v1/contracts/{contract_id}",
            json={
                "recoupment_rate": "0.65000",
                "legal_status": "executed"
            }
        )
        assert patch_contract_response.status_code == 200
        assert patch_contract_response.json()["recoupment_rate"] == "0.65000"

        agent_state_response = client.post(
            "/api/v1/agent-states",
            json={
                "agent_name": "test-agent",
                "thread_id": "thread-1",
                "entity_type": "artist",
                "entity_id": artist_id,
                "conversation_thread": [],
                "graph_history": [],
                "tool_execution_logs": [],
                "state_status": "initialized"
            }
        )
        assert agent_state_response.status_code == 201

        delete_track_response = client.delete(f"/api/v1/tracks/{track_id}")
        assert delete_track_response.status_code == 204


def test_ar_discovery_scan_persists_thread_state():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/agents/ar-discovery/scan",
            json={
                "label_priority_genres": ["indie pop", "alt-r&b"],
                "persist_state": True,
                "candidates": [
                    {
                        "artist_name": "Luna Vale",
                        "track_title": "Neon Hearts",
                        "unreleased": True,
                        "primary_genre": "indie pop",
                        "mood": "uplifting",
                        "bpm": 118,
                        "growth_points_gx": 86,
                        "engagement_points_ix": 81,
                        "cross_platform_mentions": 840,
                        "save_rate": 0.34,
                        "completion_rate": 0.71,
                        "target_similarity": 0.88,
                        "markets": ["US", "UK"]
                    },
                    {
                        "artist_name": "Grey Static",
                        "track_title": "Low Tide",
                        "unreleased": True,
                        "primary_genre": "ambient",
                        "mood": "brooding",
                        "bpm": 76,
                        "growth_points_gx": 42,
                        "engagement_points_ix": 39,
                        "cross_platform_mentions": 120,
                        "save_rate": 0.11,
                        "completion_rate": 0.25,
                        "target_similarity": 0.31,
                        "markets": ["DE"]
                    }
                ]
            }
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["reviewed_assets_count"] == 2
        assert len(payload["flagged_assets"]) == 1
        assert payload["state_id"] is not None

        thread_response = client.get(
            f"/api/v1/agents/ar-discovery/threads/{payload['thread_id']}"
        )
        assert thread_response.status_code == 200
        assert thread_response.json()["agent_name"] == "ar-discovery"


def test_virtual_manager_generates_six_week_plan_and_persists_state():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/agents/virtual-manager/release-plan",
            json={
                "artist_name": "Nova Bloom",
                "track_title": "Midnight Relay",
                "genre": "indie pop",
                "mood": "cinematic",
                "bpm": 124,
                "release_date": "2026-08-14",
                "campaign_objective": "Grow pre-saves and convert launch-day listeners into repeat streamers.",
                "target_audience": "fans of emotionally detailed alt-pop with dancefloor crossover appeal",
                "primary_platforms": ["TikTok", "Instagram Reels", "Spotify"],
                "persist_state": True
            }
        )

        assert response.status_code == 200
        payload = response.json()
        assert len(payload["release_timeline"]) == 6
        assert payload["release_timeline"][0]["date_anchor"] == "2026-07-10"
        assert payload["state_id"] is not None

        thread_response = client.get(
            f"/api/v1/agents/virtual-manager/threads/{payload['thread_id']}"
        )
        assert thread_response.status_code == 200
        assert thread_response.json()["agent_name"] == "virtual-manager"
