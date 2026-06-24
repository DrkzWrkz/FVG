"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, RadioTower, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type {
  DiscoveryCandidate,
  DiscoveryOpportunity,
  DiscoveryScanResponse
} from "@/lib/agent-types";
import { postToOrchestrator } from "@/lib/orchestrator-client";

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50";
const labelClassName = "text-sm font-medium text-slate-200";

const initialCandidate = (): DiscoveryCandidate => ({
  artist_name: "",
  track_title: "",
  unreleased: true,
  primary_genre: "indie pop",
  mood: "uplifting",
  bpm: 118,
  growth_points_gx: 70,
  engagement_points_ix: 68,
  cross_platform_mentions: 250,
  save_rate: 0.22,
  completion_rate: 0.55,
  target_similarity: 0.7,
  markets: ["US", "UK"]
});

function MarketsInput({
  value,
  onChange
}: {
  value: string[];
  onChange: (nextValue: string[]) => void;
}) {
  return (
    <input
      className={fieldClassName}
      value={value.join(", ")}
      onChange={(event) =>
        onChange(
          event.target.value
            .split(",")
            .map((market) => market.trim())
            .filter(Boolean)
        )
      }
      placeholder="US, UK, DE"
    />
  );
}

function OpportunityCard({
  asset,
  tone
}: {
  asset: DiscoveryOpportunity;
  tone: "flagged" | "watchlist";
}) {
  const toneStyles =
    tone === "flagged"
      ? "border-emerald-400/25 bg-emerald-400/10"
      : "border-sky-400/20 bg-sky-400/10";

  return (
    <div className={`rounded-3xl border p-5 ${toneStyles}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">
            {asset.artist_name} - {asset.track_title}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Score band: {asset.score_band} | Markets: {asset.markets.join(", ") || "n/a"}
          </p>
        </div>
        <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-sm font-medium text-white">
          {asset.signal_breakdown.total_score.toFixed(2)}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Growth", asset.signal_breakdown.growth_score],
          ["Engagement", asset.signal_breakdown.engagement_score],
          ["Acoustic fit", asset.signal_breakdown.acoustic_match_score],
          ["Traction", asset.signal_breakdown.platform_traction_score]
        ].map(([label, score]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{Number(score).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-200">
        {asset.rationale.map((reason) => (
          <li key={reason} className="flex gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ArDiscoveryPanel() {
  const [priorityGenres, setPriorityGenres] = useState("indie pop, alt-r&b, melodic rap");
  const [minimumScore, setMinimumScore] = useState(70);
  const [persistState, setPersistState] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [candidates, setCandidates] = useState<DiscoveryCandidate[]>([
    {
      ...initialCandidate(),
      artist_name: "Luna Vale",
      track_title: "Neon Hearts",
      growth_points_gx: 86,
      engagement_points_ix: 81,
      cross_platform_mentions: 840,
      save_rate: 0.34,
      completion_rate: 0.71,
      target_similarity: 0.88
    },
    {
      ...initialCandidate(),
      artist_name: "Grey Static",
      track_title: "Low Tide",
      primary_genre: "ambient",
      mood: "brooding",
      bpm: 76,
      growth_points_gx: 42,
      engagement_points_ix: 39,
      cross_platform_mentions: 120,
      save_rate: 0.11,
      completion_rate: 0.25,
      target_similarity: 0.31,
      markets: ["DE"]
    }
  ]);
  const [result, setResult] = useState<DiscoveryScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reviewedMarkets = useMemo(
    () =>
      Array.from(
        new Set(candidates.flatMap((candidate) => candidate.markets).filter(Boolean))
      ).join(", "),
    [candidates]
  );

  const updateCandidate = <K extends keyof DiscoveryCandidate>(
    index: number,
    key: K,
    value: DiscoveryCandidate[K]
  ) => {
    setCandidates((current) =>
      current.map((candidate, candidateIndex) =>
        candidateIndex === index ? { ...candidate, [key]: value } : candidate
      )
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await postToOrchestrator<DiscoveryScanResponse, object>(
        "/api/v1/agents/ar-discovery/scan",
        {
          label_priority_genres: priorityGenres
            .split(",")
            .map((genre) => genre.trim())
            .filter(Boolean),
          minimum_score: minimumScore,
          persist_state: persistState,
          thread_id: threadId.trim() || null,
          candidates
        }
      );

      setResult(response);
      setThreadId(response.thread_id);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-emerald-400/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <RadioTower className="h-5 w-5 text-emerald-300" />
          A&R Discovery dashboard
        </CardTitle>
        <CardDescription>
          Review synthetic social telemetry and acoustic matching to decide which assets deserve
          immediate label attention.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2">
              <span className={labelClassName}>Priority genres</span>
              <input
                className={fieldClassName}
                value={priorityGenres}
                onChange={(event) => setPriorityGenres(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Minimum score</span>
              <input
                className={fieldClassName}
                type="number"
                min={0}
                max={100}
                value={minimumScore}
                onChange={(event) => setMinimumScore(Number(event.target.value))}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Thread ID</span>
              <input
                className={fieldClassName}
                value={threadId}
                onChange={(event) => setThreadId(event.target.value)}
                placeholder="Optional custom thread identifier"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3">
            <label className="flex items-center gap-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={persistState}
                onChange={(event) => setPersistState(event.target.checked)}
              />
              Persist agent state to the backend memory table
            </label>
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Active markets: {reviewedMarkets || "none"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Candidate pool</p>
                <p className="text-sm text-slate-400">
                  Model social telemetry, engagement intensity, and similarity signals per asset.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCandidates((current) => [...current, initialCandidate()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add candidate
              </Button>
            </div>

            {candidates.map((candidate, index) => (
              <div
                key={`${candidate.artist_name}-${candidate.track_title}-${index}`}
                className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/45 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-white">Candidate #{index + 1}</p>
                  {candidates.length > 1 ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setCandidates((current) => current.filter((_, candidateIndex) => candidateIndex !== index))
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-2">
                    <span className={labelClassName}>Artist name</span>
                    <input
                      className={fieldClassName}
                      value={candidate.artist_name}
                      onChange={(event) => updateCandidate(index, "artist_name", event.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClassName}>Track title</span>
                    <input
                      className={fieldClassName}
                      value={candidate.track_title}
                      onChange={(event) => updateCandidate(index, "track_title", event.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClassName}>Genre</span>
                    <input
                      className={fieldClassName}
                      value={candidate.primary_genre}
                      onChange={(event) => updateCandidate(index, "primary_genre", event.target.value)}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className={labelClassName}>Mood</span>
                    <input
                      className={fieldClassName}
                      value={candidate.mood}
                      onChange={(event) => updateCandidate(index, "mood", event.target.value)}
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["bpm", "BPM", 40, 220, 1],
                    ["growth_points_gx", "Growth Gx", 0, 100, 1],
                    ["engagement_points_ix", "Engagement Ix", 0, 100, 1],
                    ["cross_platform_mentions", "Cross-platform mentions", 0, 5000, 1],
                    ["save_rate", "Save rate", 0, 1, 0.01],
                    ["completion_rate", "Completion rate", 0, 1, 0.01],
                    ["target_similarity", "Target similarity", 0, 1, 0.01]
                  ].map(([key, label, min, max, step]) => (
                    <label key={key} className="space-y-2">
                      <span className={labelClassName}>{label}</span>
                      <input
                        className={fieldClassName}
                        type="number"
                        min={Number(min)}
                        max={Number(max)}
                        step={Number(step)}
                        value={candidate[key as keyof DiscoveryCandidate] as number}
                        onChange={(event) =>
                          updateCandidate(
                            index,
                            key as keyof DiscoveryCandidate,
                            Number(event.target.value) as never
                          )
                        }
                      />
                    </label>
                  ))}
                  <label className="space-y-2">
                    <span className={labelClassName}>Markets</span>
                    <MarketsInput
                      value={candidate.markets}
                      onChange={(nextValue) => updateCandidate(index, "markets", nextValue)}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={candidate.unreleased}
                    onChange={(event) => updateCandidate(index, "unreleased", event.target.checked)}
                  />
                  Unreleased or independent asset
                </label>
              </div>
            ))}
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run A&R scan
          </Button>
        </form>

        {result ? (
          <div className="space-y-5 border-t border-white/10 pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thread ID</p>
                <p className="mt-2 text-sm font-medium text-white">{result.thread_id}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Reviewed assets</p>
                <p className="mt-2 text-2xl font-semibold text-white">{result.reviewed_assets_count}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Persisted state</p>
                <p className="mt-2 text-sm font-medium text-white">{result.state_id ?? "Not persisted"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-white">Flagged assets</p>
                <p className="text-sm text-slate-400">
                  Assets that passed the current score threshold.
                </p>
              </div>
              {result.flagged_assets.length > 0 ? (
                result.flagged_assets.map((asset) => (
                  <OpportunityCard
                    key={`${asset.artist_name}-${asset.track_title}-flagged`}
                    asset={asset}
                    tone="flagged"
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-slate-400">
                  No assets met the current priority threshold.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-white">Watchlist assets</p>
                <p className="text-sm text-slate-400">
                  Near-threshold candidates worth monitoring for additional traction.
                </p>
              </div>
              {result.watchlist_assets.length > 0 ? (
                result.watchlist_assets.map((asset) => (
                  <OpportunityCard
                    key={`${asset.artist_name}-${asset.track_title}-watchlist`}
                    asset={asset}
                    tone="watchlist"
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-slate-400">
                  No watchlist assets were returned from this scan.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
