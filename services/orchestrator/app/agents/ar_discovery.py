from __future__ import annotations

from datetime import datetime, timezone

from schemas import (
    DiscoveryCandidate,
    DiscoveryOpportunity,
    DiscoveryScanRequest,
    DiscoveryScanResponse,
    DiscoverySignalBreakdown
)

AGENT_BLUEPRINT = {
    "id": "ar-discovery",
    "name": "A&R Discovery Agent",
    "workflow_style": "signal-driven scouting",
    "status": "implemented",
    "core_logic": "Simulate social telemetry, engagement velocity, and acoustic similarity scoring.",
    "responsibilities": [
        "Track synthetic Spotify and TikTok momentum indicators.",
        "Evaluate growth and engagement deltas for unreleased or independent assets.",
        "Flag high-potential artists and tracks for downstream action."
    ],
    "planned_tools": [
        "mock-streaming-telemetry",
        "cross-platform-signal-parser",
        "acoustic-match-ranking"
    ]
}


def _score_band(total_score: float) -> str:
    if total_score >= 85:
        return "priority-signing"
    if total_score >= 70:
        return "accelerated-watchlist"
    if total_score >= 55:
        return "monitor"
    return "hold"


def _build_rationale(
    candidate: DiscoveryCandidate,
    total_score: float,
    label_priority_genres: list[str]
) -> list[str]:
    rationale: list[str] = []

    if candidate.growth_points_gx >= 75:
        rationale.append("Growth velocity is materially ahead of baseline scouting thresholds.")
    if candidate.engagement_points_ix >= 70:
        rationale.append("Audience engagement intensity suggests early fan commitment.")
    if candidate.primary_genre.lower() in {genre.lower() for genre in label_priority_genres}:
        rationale.append("Sound profile aligns with active label priority genres.")
    if candidate.unreleased:
        rationale.append("Asset is unreleased, creating first-mover leverage for campaign planning.")
    if candidate.cross_platform_mentions >= 500:
        rationale.append("Cross-platform mention volume indicates traction beyond a single network.")
    if total_score < 55:
        rationale.append("Signals are emerging but not yet strong enough for immediate action.")

    return rationale


def score_candidate(
    candidate: DiscoveryCandidate,
    label_priority_genres: list[str],
    minimum_score: float
) -> DiscoveryOpportunity:
    genre_match_bonus = (
        18
        if candidate.primary_genre.lower() in {genre.lower() for genre in label_priority_genres}
        else 8
    )
    tempo_fit = 12 if 85 <= candidate.bpm <= 140 else 6

    acoustic_match_score = min(
        round((candidate.target_similarity * 70) + genre_match_bonus + tempo_fit, 2),
        100
    )
    platform_traction_score = min(
        round(
            min(candidate.cross_platform_mentions / 12, 55)
            + (candidate.save_rate * 20)
            + (candidate.completion_rate * 25),
            2
        ),
        100
    )
    total_score = round(
        (candidate.growth_points_gx * 0.30)
        + (candidate.engagement_points_ix * 0.25)
        + (acoustic_match_score * 0.20)
        + (platform_traction_score * 0.25)
        + (4 if candidate.unreleased else 0),
        2
    )

    return DiscoveryOpportunity(
        artist_name=candidate.artist_name,
        track_title=candidate.track_title,
        flagged=total_score >= minimum_score,
        score_band=_score_band(total_score),
        markets=candidate.markets,
        signal_breakdown=DiscoverySignalBreakdown(
            growth_score=round(candidate.growth_points_gx, 2),
            engagement_score=round(candidate.engagement_points_ix, 2),
            acoustic_match_score=acoustic_match_score,
            platform_traction_score=platform_traction_score,
            total_score=total_score
        ),
        rationale=_build_rationale(candidate, total_score, label_priority_genres)
    )


def run_discovery_scan(payload: DiscoveryScanRequest) -> DiscoveryScanResponse:
    scored_assets = [
        score_candidate(
            candidate=candidate,
            label_priority_genres=payload.label_priority_genres,
            minimum_score=payload.minimum_score
        )
        for candidate in payload.candidates
    ]

    flagged_assets = [asset for asset in scored_assets if asset.flagged]
    watchlist_assets = [
        asset for asset in scored_assets
        if not asset.flagged and asset.signal_breakdown.total_score >= max(payload.minimum_score - 12, 0)
    ]

    return DiscoveryScanResponse(
        thread_id=payload.thread_id or f"ar-discovery-{int(datetime.now(timezone.utc).timestamp())}",
        reviewed_assets_count=len(payload.candidates),
        flagged_assets=flagged_assets,
        watchlist_assets=watchlist_assets,
        generated_at=datetime.now(timezone.utc)
    )
