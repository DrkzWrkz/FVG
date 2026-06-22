from __future__ import annotations

from datetime import datetime, timezone
from itertools import islice

from schemas import (
    AudienceSegment,
    CanvasPromptOutput,
    CopywriterOutput,
    MarketResearchOutput,
    MarketingCrewRequest,
    MarketingCrewResponse,
    MediaMatchOutput,
    OutreachPlanOutput,
    PressKitOutput,
    SocialCopyOutput
)

AGENT_BLUEPRINT = {
    "id": "marketing-pr-crew",
    "name": "Multi-Agent Marketing & PR Crew",
    "workflow_style": "linear crew pipeline",
    "status": "implemented",
    "core_logic": "Coordinate market research, creative generation, and media matching in a role-based pipeline.",
    "responsibilities": [
        "Extract demographics and trending keywords for an audience segment.",
        "Generate press kits, Spotify Canvas prompts, and social copy.",
        "Rank media targets through semantic similarity against a press database."
    ],
    "planned_tools": [
        "market-research-agent",
        "copywriter-agent",
        "pr-outreach-agent"
    ]
}

MEDIA_DATABASE = [
    {
        "outlet_name": "Culture Current",
        "editor_role": "Senior Music Editor",
        "beat_focus": "Breaking artist discovery, cross-platform momentum, culture writing",
        "keywords": {
            "discovery",
            "viral",
            "culture",
            "indie",
            "alt-pop",
            "storytelling",
            "fan community"
        }
    },
    {
        "outlet_name": "Playlist Press",
        "editor_role": "Streaming and Editorial Features Writer",
        "beat_focus": "Streaming strategy, playlist positioning, DSP editorials",
        "keywords": {
            "spotify",
            "playlist",
            "editorial",
            "pre-save",
            "release",
            "streaming",
            "momentum"
        }
    },
    {
        "outlet_name": "Late Night Signals",
        "editor_role": "Alt Music Columnist",
        "beat_focus": "Alternative pop, emotionally cinematic releases, fan-first campaigns",
        "keywords": {
            "alt-pop",
            "cinematic",
            "emotional",
            "indie pop",
            "visual",
            "night drive",
            "narrative"
        }
    },
    {
        "outlet_name": "Global Rhythm Desk",
        "editor_role": "International Trends Editor",
        "beat_focus": "Regional breakout signals, diaspora audiences, emerging export acts",
        "keywords": {
            "global",
            "regional",
            "diaspora",
            "export",
            "growth",
            "audience",
            "market"
        }
    },
    {
        "outlet_name": "Creator Loop",
        "editor_role": "Social Video Producer",
        "beat_focus": "Short-form creative, Canvas concepts, creator-driven campaign hooks",
        "keywords": {
            "tiktok",
            "reels",
            "canvas",
            "creator",
            "ugc",
            "visual",
            "hook"
        }
    }
]

PLATFORM_MAP = {
    "indie pop": ["TikTok", "Instagram Reels", "Spotify"],
    "alt-r&b": ["TikTok", "YouTube Shorts", "Spotify"],
    "melodic rap": ["TikTok", "Instagram Reels", "YouTube Shorts"],
    "ambient": ["Instagram Reels", "YouTube", "Spotify"]
}


def _normalize_tokens(*values: object) -> set[str]:
    raw_text = " ".join(str(value).lower() for value in values if value)
    for character in [",", ".", "&", "-", "/", ":", ";", "(", ")", "'"]:
        raw_text = raw_text.replace(character, " ")
    return {token for token in raw_text.split() if len(token) > 2}


def _default_platforms(genre: str) -> list[str]:
    return PLATFORM_MAP.get(genre.lower(), ["TikTok", "Instagram Reels", "Spotify"])


def _market_research(payload: MarketingCrewRequest) -> MarketResearchOutput:
    platforms = _default_platforms(payload.genre)
    audience_segments = [
        AudienceSegment(
            name="Core discovery fans",
            age_range="18-24",
            platforms=platforms,
            motivations=[
                "Find rising artists before mainstream saturation.",
                "Share emotionally resonant tracks with social proof value."
            ]
        ),
        AudienceSegment(
            name="Intent-driven repeat listeners",
            age_range="24-34",
            platforms=["Spotify", "Instagram", "Email"],
            motivations=[
                "Follow artists with coherent release narratives.",
                "Respond to storytelling and behind-the-scenes campaign access."
            ]
        )
    ]

    trending_keywords = list(
        dict.fromkeys(
            [
                payload.genre,
                payload.mood,
                "new music friday",
                "artist to watch",
                "playlist pitch",
                "fan-first release",
                *payload.comparison_artists[:2],
                *payload.differentiators[:3]
            ]
        )
    )

    regional_priorities = payload.priority_markets or ["US", "UK", "CA"]
    positioning_notes = [
        f"Position {payload.track_title} as a {payload.mood} {payload.genre} release designed for {payload.target_audience}.",
        "Lead with discovery velocity, then convert attention into pre-save and release-day action.",
        f"Use {', '.join(platforms)} as the primary distribution surface for the initial campaign loop."
    ]

    if payload.comparison_artists:
        positioning_notes.append(
            f"Reference tonal adjacency to {', '.join(islice(payload.comparison_artists, 2))} without losing the artist's own identity."
        )

    return MarketResearchOutput(
        audience_segments=audience_segments,
        trending_keywords=trending_keywords,
        regional_priorities=regional_priorities,
        positioning_notes=positioning_notes
    )


def _copywriter_output(
    payload: MarketingCrewRequest,
    research: MarketResearchOutput
) -> CopywriterOutput:
    comparison_frame = (
        f" Fans of {', '.join(islice(payload.comparison_artists, 2))} will recognize the lane,"
        if payload.comparison_artists
        else ""
    )
    differentiation_line = (
        f" The release stands out through {', '.join(islice(payload.differentiators, 3))}."
        if payload.differentiators
        else ""
    )

    press_kit = PressKitOutput(
        headline=f"{payload.artist_name} turns {payload.mood} into a high-intent {payload.genre} campaign moment",
        artist_bio=(
            f"{payload.artist_name} is building an audience through emotionally precise releases and "
            f"operator-grade campaign planning. {comparison_frame}{differentiation_line}"
        ).strip(),
        press_angle=(
            f"{payload.track_title} is framed as a discovery-first record: visually adaptable, playlist-ready, "
            f"and built around {payload.campaign_objective.lower()}."
        ),
        talking_points=[
            f"{payload.track_title} combines {payload.mood} storytelling with {payload.bpm} BPM pacing.",
            f"The campaign focuses on {', '.join(research.regional_priorities)} as priority markets.",
            "The rollout emphasizes short-form social, editorial pitching, and fan-retention messaging."
        ]
    )

    canvas_prompt = CanvasPromptOutput(
        visual_direction=f"{payload.mood} visuals with motion cues tailored to {payload.genre} storytelling.",
        motion_notes=[
            "Use loop-friendly transitions that feel native to Spotify Canvas.",
            "Build contrast between close-up artist moments and kinetic typography.",
            "Keep the first two seconds visually arresting for social cut-down reuse."
        ],
        prompt=(
            f"Create an 8-second Spotify Canvas for {payload.artist_name} - {payload.track_title} with "
            f"{payload.mood} lighting, subtle camera drift, textured overlays, and a {payload.genre} aesthetic "
            "that can also be repurposed into short-form teaser assets."
        )
    )

    social_copy = [
        SocialCopyOutput(
            platform=platform,
            hook=f"{payload.track_title} is landing as a {payload.mood} {payload.genre} moment.",
            caption=(
                f"{payload.artist_name} is opening the next chapter with {payload.track_title}. "
                f"Built for {payload.target_audience}, this rollout is centered on {payload.campaign_objective.lower()}."
            ),
            call_to_action=(
                "Pre-save now" if platform == "Spotify" else "Comment your first impression and share the snippet"
            )
        )
        for platform in _default_platforms(payload.genre)
    ]

    return CopywriterOutput(
        press_kit=press_kit,
        canvas_prompt=canvas_prompt,
        social_copy=social_copy
    )


def _match_media_outlets(
    payload: MarketingCrewRequest,
    research: MarketResearchOutput,
    copywriter_output: CopywriterOutput
) -> OutreachPlanOutput:
    campaign_keywords = _normalize_tokens(
        payload.genre,
        payload.mood,
        payload.target_audience,
        payload.campaign_objective,
        " ".join(research.trending_keywords),
        copywriter_output.press_kit.press_angle,
        " ".join(payload.priority_markets),
        " ".join(payload.differentiators)
    )

    matches: list[MediaMatchOutput] = []
    for outlet in MEDIA_DATABASE:
        outlet_keywords = _normalize_tokens(" ".join(sorted(outlet["keywords"])), outlet["beat_focus"])
        overlap = campaign_keywords & outlet_keywords
        union = campaign_keywords | outlet_keywords
        match_score = round((len(overlap) / max(len(union), 1)) * 100 + (len(overlap) * 6), 2)

        rationale = [
            f"Beat focus aligns with {outlet['beat_focus'].lower()}."
        ]
        if overlap:
            rationale.append(f"Shared campaign vocabulary: {', '.join(sorted(overlap))}.")
        if payload.priority_markets:
            rationale.append(
                f"Pitch can be localized for priority markets: {', '.join(payload.priority_markets)}."
            )

        matches.append(
            MediaMatchOutput(
                outlet_name=outlet["outlet_name"],
                editor_role=outlet["editor_role"],
                beat_focus=outlet["beat_focus"],
                match_score=match_score,
                rationale=rationale,
                outreach_subject=f"{payload.artist_name} - {payload.track_title} | {payload.genre} feature pitch",
                outreach_pitch=(
                    f"Hi {outlet['editor_role']}, {payload.artist_name} is launching {payload.track_title}, "
                    f"a {payload.mood} {payload.genre} release with a campaign built around "
                    f"{payload.campaign_objective.lower()}. The story is strongest for readers interested in "
                    f"{outlet['beat_focus'].lower()}."
                )
            )
        )

    ranked_matches = sorted(matches, key=lambda item: item.match_score, reverse=True)[:4]
    sequencing_notes = [
        "Start with the highest-scoring editorial and discovery outlets first.",
        "Follow creator-led or visual-first publications after social snippets and Canvas assets are ready.",
        "Localize the opener for each priority market if the release is showing early regional traction."
    ]

    return OutreachPlanOutput(
        priority_matches=ranked_matches,
        sequencing_notes=sequencing_notes
    )


def run_marketing_pr_crew(payload: MarketingCrewRequest) -> MarketingCrewResponse:
    research = _market_research(payload)
    copywriter_output = _copywriter_output(payload, research)
    outreach_plan = _match_media_outlets(payload, research, copywriter_output)

    return MarketingCrewResponse(
        thread_id=payload.thread_id or f"marketing-pr-{int(datetime.now(timezone.utc).timestamp())}",
        campaign_brief=(
            f"Marketing crew pipeline for {payload.artist_name} - {payload.track_title}: "
            f"market research targets {', '.join(research.regional_priorities)}, "
            f"copy generation centers {payload.mood} {payload.genre} positioning, and "
            "outreach ranks media matches for immediate sequencing."
        ),
        market_research=research,
        copywriter_output=copywriter_output,
        outreach_plan=outreach_plan,
        generated_at=datetime.now(timezone.utc)
    )
