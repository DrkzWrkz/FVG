from __future__ import annotations

from datetime import datetime, timedelta, timezone

from schemas import (
    FanEmailItem,
    PitchingCopyItem,
    ReleaseStrategyRequest,
    ReleaseStrategyResponse,
    ReleaseWeekPlan,
    SocialScheduleItem
)

AGENT_BLUEPRINT = {
    "id": "virtual-manager",
    "name": "Autonomous Virtual Manager Agent",
    "workflow_style": "stateful release planning",
    "status": "implemented",
    "core_logic": "Generate six-week release calendars from track metadata, audience context, and campaign state.",
    "responsibilities": [
        "Draft pre-save, launch, and post-launch milestones.",
        "Produce structured social, pitching, and fan email sequences.",
        "Maintain longitudinal strategy state across a release lifecycle."
    ],
    "planned_tools": [
        "release-calendar-generator",
        "pitch-copy-drafter",
        "fan-sequence-builder"
    ]
}

WEEK_PHASES = [
    ("Week 1", "Audience calibration", -35),
    ("Week 2", "Story seeding", -28),
    ("Week 3", "Pre-save acceleration", -21),
    ("Week 4", "Conversion push", -14),
    ("Week 5", "Launch week", 0),
    ("Week 6", "Post-launch retention", 7)
]


def _tone_descriptor(mood: str, bpm: int) -> str:
    if bpm >= 130:
        return f"high-energy {mood}"
    if bpm <= 90:
        return f"slow-burn {mood}"
    return f"mid-tempo {mood}"


def _platform_rotation(primary_platforms: list[str], index: int) -> list[str]:
    if not primary_platforms:
        return ["TikTok", "Instagram Reels", "Spotify"]

    ordered = primary_platforms[index % len(primary_platforms):] + primary_platforms[:index % len(primary_platforms)]
    while len(ordered) < 3:
        ordered.append(primary_platforms[len(ordered) % len(primary_platforms)])
    return ordered[:3]


def _social_schedule(
    payload: ReleaseStrategyRequest,
    week_number: int,
    focus: str,
    phase: str
) -> list[SocialScheduleItem]:
    channels = _platform_rotation(payload.primary_platforms, week_number - 1)
    hooks = [
        f"Frame {payload.track_title} as a {payload.genre} moment built for {payload.target_audience.lower()}",
        f"Highlight the {payload.mood} tone and fan narrative behind {payload.track_title}",
        f"Drive a specific CTA tied to {payload.campaign_objective.lower()}"
    ]

    return [
        SocialScheduleItem(
            week_number=week_number,
            day_label=day_label,
            channel=channel,
            objective=focus,
            copy=(
                f"{payload.artist_name} uses {channel} to push {phase.lower()}: "
                f"{hook}."
            ),
            asset_prompt=(
                f"Create a vertical visual for {payload.artist_name} - {payload.track_title} "
                f"with a {_tone_descriptor(payload.mood, payload.bpm)} palette for {channel}."
            )
        )
        for day_label, channel, hook in zip(
            ["Monday", "Wednesday", "Friday"],
            channels,
            hooks,
            strict=True
        )
    ]


def _pitching_copy(
    payload: ReleaseStrategyRequest,
    focus: str,
    date_anchor: str
) -> list[PitchingCopyItem]:
    descriptor = _tone_descriptor(payload.mood, payload.bpm)

    return [
        PitchingCopyItem(
            recipient_type="DSP editorial",
            subject_line=f"{payload.artist_name} | {payload.track_title} | {date_anchor}",
            body=(
                f"{payload.track_title} is a {descriptor} {payload.genre} record engineered for "
                f"{focus.lower()}. Emphasize listener intent, save momentum, and a clear narrative "
                f"for Spotify editorial positioning."
            )
        ),
        PitchingCopyItem(
            recipient_type="Press and tastemakers",
            subject_line=f"Press angle: {payload.artist_name} reframes {payload.genre} through {payload.mood}",
            body=(
                f"Center the story on how {payload.artist_name} turns {payload.mood} into a "
                f"{payload.genre} release with audience-first rollout mechanics and a measurable "
                f"community hook tied to {payload.campaign_objective.lower()}."
            )
        )
    ]


def _fan_email_sequence(
    payload: ReleaseStrategyRequest,
    phase: str,
    date_anchor: str
) -> list[FanEmailItem]:
    return [
        FanEmailItem(
            send_window=date_anchor,
            subject_line=f"{payload.artist_name}: {phase} for {payload.track_title}",
            preview_text=f"A new {payload.genre} chapter is unfolding for core fans first.",
            body_summary=(
                f"Explain the emotional world of {payload.track_title}, connect it to the "
                f"{payload.mood} mood, and invite fans into the next campaign milestone."
            ),
            call_to_action=(
                "Pre-save now" if "Launch" not in phase else "Stream and share on release day"
            )
        )
    ]


def _date_anchor(payload: ReleaseStrategyRequest, offset_days: int) -> str:
    if payload.release_date is None:
        if offset_days < 0:
            return f"T{offset_days // 7} weeks"
        if offset_days == 0:
            return "Release week"
        return f"T+{offset_days // 7} week"

    target_date = payload.release_date + timedelta(days=offset_days)
    return target_date.isoformat()


def build_release_strategy(payload: ReleaseStrategyRequest) -> ReleaseStrategyResponse:
    thread_id = payload.thread_id or f"virtual-manager-{int(datetime.now(timezone.utc).timestamp())}"
    timeline: list[ReleaseWeekPlan] = []

    for index, (week_label, focus, offset_days) in enumerate(WEEK_PHASES, start=1):
        date_anchor = _date_anchor(payload, offset_days)
        timeline.append(
            ReleaseWeekPlan(
                week_number=index,
                phase=week_label,
                date_anchor=date_anchor,
                strategic_focus=focus,
                social_schedule=_social_schedule(
                    payload=payload,
                    week_number=index,
                    focus=focus,
                    phase=week_label
                ),
                pitching_copy=_pitching_copy(payload=payload, focus=focus, date_anchor=date_anchor),
                fan_email_sequence=_fan_email_sequence(
                    payload=payload,
                    phase=week_label,
                    date_anchor=date_anchor
                )
            )
        )

    return ReleaseStrategyResponse(
        thread_id=thread_id,
        artist_name=payload.artist_name,
        track_title=payload.track_title,
        campaign_summary=(
            f"Six-week strategy for {payload.artist_name} blends {payload.genre} positioning, "
            f"{payload.mood} storytelling, and {payload.bpm} BPM pacing into a coordinated "
            f"pre-save, launch, and retention sequence."
        ),
        release_timeline=timeline,
        generated_at=datetime.now(timezone.utc)
    )
