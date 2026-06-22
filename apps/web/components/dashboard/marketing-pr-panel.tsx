"use client";

import { useState } from "react";
import { Loader2, Megaphone, Newspaper, Search, Send, Sparkles, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { MarketingCrewResponse } from "@/lib/agent-types";
import { postToOrchestrator } from "@/lib/orchestrator-client";

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50";
const labelClassName = "text-sm font-medium text-slate-200";

function csvToList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MarketingPrPanel() {
  const [artistName, setArtistName] = useState("Nova Bloom");
  const [trackTitle, setTrackTitle] = useState("Midnight Relay");
  const [genre, setGenre] = useState("indie pop");
  const [mood, setMood] = useState("cinematic");
  const [bpm, setBpm] = useState(124);
  const [campaignObjective, setCampaignObjective] = useState(
    "Expand discovery and secure editorial plus culture coverage."
  );
  const [targetAudience, setTargetAudience] = useState(
    "fans of emotionally detailed alt-pop with playlist and social sharing behavior"
  );
  const [comparisonArtists, setComparisonArtists] = useState("MUNA, The Japanese House");
  const [differentiators, setDifferentiators] = useState(
    "night-drive visuals, high-retention hooks, fan-first storytelling"
  );
  const [priorityMarkets, setPriorityMarkets] = useState("US, UK, CA");
  const [persistState, setPersistState] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [result, setResult] = useState<MarketingCrewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await postToOrchestrator<MarketingCrewResponse, object>(
        "/api/v1/agents/marketing-pr/launch-campaign",
        {
          artist_name: artistName,
          track_title: trackTitle,
          genre,
          mood,
          bpm,
          campaign_objective: campaignObjective,
          target_audience: targetAudience,
          comparison_artists: csvToList(comparisonArtists),
          differentiators: csvToList(differentiators),
          priority_markets: csvToList(priorityMarkets),
          persist_state: persistState,
          thread_id: threadId.trim() || null
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
          <Megaphone className="h-5 w-5 text-emerald-300" />
          Marketing & PR Crew pipeline
        </CardTitle>
        <CardDescription>
          Run market research, copy generation, and media matching in one operator-driven pipeline.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className={labelClassName}>Artist</span>
              <input className={fieldClassName} value={artistName} onChange={(event) => setArtistName(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Track title</span>
              <input className={fieldClassName} value={trackTitle} onChange={(event) => setTrackTitle(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Genre</span>
              <input className={fieldClassName} value={genre} onChange={(event) => setGenre(event.target.value)} />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Mood</span>
              <input className={fieldClassName} value={mood} onChange={(event) => setMood(event.target.value)} />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className={labelClassName}>BPM</span>
              <input
                className={fieldClassName}
                type="number"
                min={40}
                max={220}
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value))}
              />
            </label>
            <label className="space-y-2 xl:col-span-3">
              <span className={labelClassName}>Priority markets</span>
              <input
                className={fieldClassName}
                value={priorityMarkets}
                onChange={(event) => setPriorityMarkets(event.target.value)}
                placeholder="US, UK, CA"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className={labelClassName}>Campaign objective</span>
            <textarea
              className={`${fieldClassName} min-h-24`}
              value={campaignObjective}
              onChange={(event) => setCampaignObjective(event.target.value)}
            />
          </label>

          <label className="space-y-2">
            <span className={labelClassName}>Target audience</span>
            <textarea
              className={`${fieldClassName} min-h-24`}
              value={targetAudience}
              onChange={(event) => setTargetAudience(event.target.value)}
            />
          </label>

          <div className="grid gap-4 xl:grid-cols-2">
            <label className="space-y-2">
              <span className={labelClassName}>Comparison artists</span>
              <input
                className={fieldClassName}
                value={comparisonArtists}
                onChange={(event) => setComparisonArtists(event.target.value)}
              />
            </label>
            <label className="space-y-2">
              <span className={labelClassName}>Differentiators</span>
              <input
                className={fieldClassName}
                value={differentiators}
                onChange={(event) => setDifferentiators(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className={labelClassName}>Thread ID</span>
              <input
                className={fieldClassName}
                value={threadId}
                onChange={(event) => setThreadId(event.target.value)}
                placeholder="Optional custom thread identifier"
              />
            </label>
            <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 lg:self-end">
              <input
                type="checkbox"
                checked={persistState}
                onChange={(event) => setPersistState(event.target.checked)}
              />
              Persist workflow state
            </label>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run marketing crew
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
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Persisted state</p>
                <p className="mt-2 text-sm font-medium text-white">{result.state_id ?? "Not persisted"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Generated at</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {new Date(result.generated_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-400/15 bg-emerald-400/10 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-200">
                Campaign brief
              </p>
              <p className="mt-3 text-base leading-7 text-white">{result.campaign_brief}</p>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Search className="h-4 w-4 text-emerald-300" />
                  Market Researcher
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trending keywords</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {result.market_research.trending_keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Audience segments</p>
                    <div className="mt-2 space-y-3">
                      {result.market_research.audience_segments.map((segment) => (
                        <div key={segment.name} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-sm font-medium text-white">{segment.name}</p>
                          <p className="mt-1 text-sm text-slate-300">{segment.age_range}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                            Platforms
                          </p>
                          <p className="mt-2 text-sm text-slate-200">{segment.platforms.join(", ")}</p>
                          <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {segment.motivations.map((motivation) => (
                              <li key={motivation} className="flex gap-2">
                                <Sparkles className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                                <span>{motivation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Newspaper className="h-4 w-4 text-emerald-300" />
                  Copywriter
                </div>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-medium text-white">
                      {result.copywriter_output.press_kit.headline}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      {result.copywriter_output.press_kit.artist_bio}
                    </p>
                    <p className="mt-3 text-sm text-emerald-200">
                      {result.copywriter_output.press_kit.press_angle}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {result.copywriter_output.press_kit.talking_points.map((point) => (
                        <li key={point} className="flex gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      <Video className="h-4 w-4 text-emerald-300" />
                      Spotify Canvas prompt
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      {result.copywriter_output.canvas_prompt.prompt}
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-300">
                      {result.copywriter_output.canvas_prompt.motion_notes.map((note) => (
                        <li key={note} className="flex gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Send className="h-4 w-4 text-emerald-300" />
                  PR Outreach
                </div>
                <div className="mt-4 space-y-3">
                  {result.outreach_plan.priority_matches.map((match) => (
                    <div key={match.outlet_name} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{match.outlet_name}</p>
                          <p className="mt-1 text-sm text-slate-300">{match.editor_role}</p>
                        </div>
                        <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-sm text-white">
                          {match.match_score.toFixed(2)}
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-emerald-200">{match.outreach_subject}</p>
                      <p className="mt-3 text-sm text-slate-300">{match.outreach_pitch}</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-300">
                        {match.rationale.map((reason) => (
                          <li key={reason} className="flex gap-2">
                            <Sparkles className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white">
                Social copy and sequencing notes
              </p>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  {result.copywriter_output.social_copy.map((item) => (
                    <div key={item.platform} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-sm font-medium text-white">{item.platform}</p>
                      <p className="mt-2 text-sm text-emerald-200">{item.hook}</p>
                      <p className="mt-3 text-sm text-slate-300">{item.caption}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">CTA</p>
                      <p className="mt-2 text-sm text-slate-200">{item.call_to_action}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-white">Outreach sequencing</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {result.outreach_plan.sequencing_notes.map((note) => (
                      <li key={note} className="flex gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
