"use client";

import { useState } from "react";
import { CalendarRange, Loader2, Mail, Music4, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { ReleaseStrategyResponse } from "@/lib/agent-types";
import { postToOrchestrator } from "@/lib/orchestrator-client";

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50";
const labelClassName = "text-sm font-medium text-slate-200";

export function VirtualManagerPanel() {
  const [artistName, setArtistName] = useState("Nova Bloom");
  const [trackTitle, setTrackTitle] = useState("Midnight Relay");
  const [genre, setGenre] = useState("indie pop");
  const [mood, setMood] = useState("cinematic");
  const [bpm, setBpm] = useState(124);
  const [releaseDate, setReleaseDate] = useState("2026-08-14");
  const [campaignObjective, setCampaignObjective] = useState(
    "Grow pre-saves and convert launch-day listeners into repeat streamers."
  );
  const [targetAudience, setTargetAudience] = useState(
    "fans of emotionally detailed alt-pop with dancefloor crossover appeal"
  );
  const [primaryPlatforms, setPrimaryPlatforms] = useState("TikTok, Instagram Reels, Spotify");
  const [persistState, setPersistState] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [result, setResult] = useState<ReleaseStrategyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await postToOrchestrator<ReleaseStrategyResponse, object>(
        "/api/v1/agents/virtual-manager/release-plan",
        {
          artist_name: artistName,
          track_title: trackTitle,
          genre,
          mood,
          bpm,
          release_date: releaseDate || null,
          campaign_objective: campaignObjective,
          target_audience: targetAudience,
          primary_platforms: primaryPlatforms
            .split(",")
            .map((platform) => platform.trim())
            .filter(Boolean),
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
          <Music4 className="h-5 w-5 text-emerald-300" />
          Virtual Manager release planner
        </CardTitle>
        <CardDescription>
          Generate a stateful six-week rollout covering pre-save activation, launch week, and
          post-release fan retention.
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
            <label className="space-y-2">
              <span className={labelClassName}>Release date</span>
              <input
                className={fieldClassName}
                type="date"
                value={releaseDate}
                onChange={(event) => setReleaseDate(event.target.value)}
              />
            </label>
            <label className="space-y-2 xl:col-span-2">
              <span className={labelClassName}>Primary platforms</span>
              <input
                className={fieldClassName}
                value={primaryPlatforms}
                onChange={(event) => setPrimaryPlatforms(event.target.value)}
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
            Generate release plan
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
                Campaign summary
              </p>
              <p className="mt-3 text-base leading-7 text-white">{result.campaign_summary}</p>
            </div>

            <div className="space-y-4">
              {result.release_timeline.map((week) => (
                <div key={`${week.week_number}-${week.phase}`} className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {week.phase} - {week.strategic_focus}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                        <CalendarRange className="h-4 w-4 text-emerald-300" />
                        {week.date_anchor}
                      </p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-sm text-slate-200">
                      Week {week.week_number}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Sparkles className="h-4 w-4 text-emerald-300" />
                        Social schedule
                      </div>
                      {week.social_schedule.map((item) => (
                        <div key={`${item.day_label}-${item.channel}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-sm font-medium text-white">
                            {item.day_label} - {item.channel}
                          </p>
                          <p className="mt-2 text-sm text-slate-300">{item.caption}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                            Asset prompt
                          </p>
                          <p className="mt-2 text-sm text-slate-300">{item.asset_prompt}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Send className="h-4 w-4 text-emerald-300" />
                        Pitching copy
                      </div>
                      {week.pitching_copy.map((item) => (
                        <div key={item.recipient_type} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-sm font-medium text-white">{item.recipient_type}</p>
                          <p className="mt-2 text-sm text-emerald-200">{item.subject_line}</p>
                          <p className="mt-3 text-sm text-slate-300">{item.body}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Mail className="h-4 w-4 text-emerald-300" />
                        Fan email sequence
                      </div>
                      {week.fan_email_sequence.map((item) => (
                        <div key={`${item.send_window}-${item.subject_line}`} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                          <p className="text-sm font-medium text-white">{item.subject_line}</p>
                          <p className="mt-2 text-sm text-emerald-200">{item.preview_text}</p>
                          <p className="mt-3 text-sm text-slate-300">{item.body_summary}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                            CTA
                          </p>
                          <p className="mt-2 text-sm text-slate-200">{item.call_to_action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
