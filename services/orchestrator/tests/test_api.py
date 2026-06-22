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


def test_marketing_pr_crew_generates_pipeline_and_persists_state():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/agents/marketing-pr/launch-campaign",
            json={
                "artist_name": "Nova Bloom",
                "track_title": "Midnight Relay",
                "genre": "indie pop",
                "mood": "cinematic",
                "bpm": 124,
                "campaign_objective": "Expand discovery and secure editorial plus culture coverage.",
                "target_audience": "fans of emotionally detailed alt-pop with playlist and social sharing behavior",
                "comparison_artists": ["MUNA", "The Japanese House"],
                "differentiators": ["night-drive visuals", "high-retention hooks", "fan-first storytelling"],
                "priority_markets": ["US", "UK", "CA"],
                "persist_state": True
            }
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["state_id"] is not None
        assert len(payload["market_research"]["audience_segments"]) >= 2
        assert len(payload["copywriter_output"]["social_copy"]) >= 3
        assert len(payload["outreach_plan"]["priority_matches"]) == 4

        thread_response = client.get(
            f"/api/v1/agents/marketing-pr/threads/{payload['thread_id']}"
        )
        assert thread_response.status_code == 200
        assert thread_response.json()["agent_name"] == "marketing-pr-crew"


def test_agent_history_route_filters_and_returns_saved_threads():
    with TestClient(app) as client:
        virtual_manager_response = client.post(
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
        assert virtual_manager_response.status_code == 200

        marketing_response = client.post(
            "/api/v1/agents/marketing-pr/launch-campaign",
            json={
                "artist_name": "Nova Bloom",
                "track_title": "Midnight Relay",
                "genre": "indie pop",
                "mood": "cinematic",
                "bpm": 124,
                "campaign_objective": "Expand discovery and secure editorial plus culture coverage.",
                "target_audience": "fans of emotionally detailed alt-pop with playlist and social sharing behavior",
                "comparison_artists": ["MUNA", "The Japanese House"],
                "differentiators": ["night-drive visuals", "high-retention hooks", "fan-first storytelling"],
                "priority_markets": ["US", "UK", "CA"],
                "persist_state": True
            }
        )
        assert marketing_response.status_code == 200

        history_response = client.get(
            "/api/v1/agents/history",
            params={"agent_name": "marketing-pr-crew"}
        )
        assert history_response.status_code == 200

        history_payload = history_response.json()
        assert len(history_payload) == 1
        assert history_payload[0]["agent_name"] == "marketing-pr-crew"
        assert history_payload[0]["latest_tool"] == "market-research-agent"
        assert history_payload[0]["tool_execution_count"] >= 1

        filtered_state_response = client.get(
            "/api/v1/agent-states",
            params={"agent_name": "virtual-manager"}
        )
        assert filtered_state_response.status_code == 200
        assert len(filtered_state_response.json()) == 1


def test_legal_document_ingestion_extracts_contract_fields():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/agents/legal-royalty/ingest-document",
            data={
                "thread_id": "legal-royalty-demo-thread",
                "raw_text": """
Artist: Nova Bloom
Track: Midnight Relay
Contract Reference: LBL-2026-INGEST
Gross Revenue: $10,000.00
Royalty Pool Rate: 80%
Distribution Fee Rate: 10%
Advance Amount: $2,000.00
Prior Unrecouped Balance: $1,000.00
Recoupment Rate: 50%
Human Written Lyrics: yes
Human Composed Melody: yes
Human Arranged Structure: yes
AI Generated Lyrics: yes
AI Generated Artwork: yes
Human Edited AI Material: yes
Source Material Rights Cleared: yes
Contributor Agreements Collected: no
Splits Confirmed By All Parties: no

Nova Bloom | artist | 60% | recoupable | nova@example.com
Signal Works | producer | 25% | recoupable | signal@example.com
Nova Bloom | writer | 10% | non-recoupable | nova-writer@example.com
"""
            }
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["thread_id"] == "legal-royalty-demo-thread"
        assert payload["source_name"] == "pasted-raw-text"
        assert payload["extracted_data"]["artist_name"] == "Nova Bloom"
        assert payload["extracted_data"]["track_title"] == "Midnight Relay"
        assert payload["extracted_data"]["contract_reference"] == "LBL-2026-INGEST"
        assert payload["extracted_data"]["gross_revenue"] == "10000.00"
        assert payload["extracted_data"]["royalty_pool_rate"] == "0.80000"
        assert len(payload["extracted_data"]["split_sheet"]) == 3
        assert payload["extracted_data"]["copyright_checklist"]["ai_generated_lyrics"] is True
        assert payload["requires_human_review"] is False


def test_legal_royalty_workflow_models_recoupment_and_flags_review():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/agents/legal-royalty/evaluate-contract",
            json={
                "artist_name": "Nova Bloom",
                "track_title": "Midnight Relay",
                "contract_reference": "LBL-2026-001",
                "split_sheet": [
                    {
                        "party_name": "Nova Bloom",
                        "role": "artist",
                        "ownership_percent": "60.00",
                        "recoupable": True,
                        "contact_email": "nova@example.com"
                    },
                    {
                        "party_name": "Signal Works",
                        "role": "producer",
                        "ownership_percent": "25.00",
                        "recoupable": True,
                        "contact_email": "signal@example.com"
                    },
                    {
                        "party_name": "Nova Bloom",
                        "role": "writer",
                        "ownership_percent": "10.00",
                        "recoupable": False,
                        "contact_email": "nova-writer@example.com"
                    }
                ],
                "gross_revenue": "10000.00",
                "royalty_pool_rate": "0.80000",
                "distribution_fee_rate": "0.10000",
                "advance_amount": "2000.00",
                "prior_unrecouped_balance": "1000.00",
                "recoupment_rate": "0.50000",
                "copyright_checklist": {
                    "has_human_written_lyrics": True,
                    "has_human_composed_melody": True,
                    "has_human_arranged_structure": True,
                    "ai_generated_lyrics": True,
                    "ai_generated_melody": False,
                    "ai_generated_master_audio": False,
                    "ai_generated_artwork": True,
                    "human_edited_ai_material": True,
                    "source_material_rights_cleared": True,
                    "contributor_agreements_collected": False,
                    "splits_confirmed_by_all_parties": False
                },
                "persist_state": True
            }
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["requires_human_review"] is True
        assert payload["split_sheet_analysis"]["duplicate_parties"] == ["Nova Bloom"]
        assert payload["copyright_eligibility"]["eligibility_status"] == "eligible-with-limitations"
        assert payload["copyright_eligibility"]["ai_disclosure_required"] is True
        assert payload["recoupment_model"]["distribution_fee_amount"] == "1000.00"
        assert payload["recoupment_model"]["royalty_pool_amount"] == "7200.00"
        assert payload["recoupment_model"]["recoupment_withheld"] == "3000.00"
        assert payload["recoupment_model"]["remaining_unrecouped_balance"] == "0.00"
        assert payload["state_id"] is not None

        checkpoint_response = client.post(
            f"/api/v1/agents/legal-royalty/threads/{payload['thread_id']}/checkpoint",
            json={
                "decision": "approved",
                "reviewer_name": "Casey Morgan",
                "reviewer_role": "Label Counsel",
                "notes": "Reviewed AI disclosure language and approved for filing prep."
            }
        )
        assert checkpoint_response.status_code == 200
        assert checkpoint_response.json()["new_status"] == "approved"

        thread_response = client.get(
            f"/api/v1/agents/legal-royalty/threads/{payload['thread_id']}"
        )
        assert thread_response.status_code == 200
        assert thread_response.json()["agent_name"] == "legal-royalty"
        assert thread_response.json()["state_status"] == "approved"
