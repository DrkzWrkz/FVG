"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3, DatabaseZap, Loader2, RefreshCcw, Search, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { AgentStateHistorySummary, AgentStateRead } from "@/lib/agent-types";
import { getFromOrchestrator } from "@/lib/orchestrator-client";

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50";

const agentOptions = [
  { value: "all", label: "All workflows" },
  { value: "ar-discovery", label: "A&R Discovery" },
  { value: "virtual-manager", label: "Virtual Manager" },
  { value: "marketing-pr-crew", label: "Marketing & PR Crew" }
];

const statusOptions = [
  { value: "all", label: "All states" },
  { value: "completed", label: "Completed" },
  { value: "initialized", label: "Initialized" }
];

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function buildHistoryQuery(agentName: string, stateStatus: string) {
  const params = new URLSearchParams({
    limit: "24"
  });

  if (agentName !== "all") {
    params.set("agent_name", agentName);
  }
  if (stateStatus !== "all") {
    params.set("state_status", stateStatus);
  }

  return `/api/v1/agents/history?${params.toString()}`;
}

export function ThreadHistoryPanel() {
  const [agentName, setAgentName] = useState("all");
  const [stateStatus, setStateStatus] = useState("all");
  const [summaries, setSummaries] = useState<AgentStateHistorySummary[]>([]);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<AgentStateRead | null>(null);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadSummaries() {
      setIsLoadingSummaries(true);
      setError(null);

      try {
        const response = await getFromOrchestrator<AgentStateHistorySummary[]>(
          buildHistoryQuery(agentName, stateStatus)
        );

        if (cancelled) {
          return;
        }

        setSummaries(response);
        setSelectedStateId((current) => {
          if (current && response.some((summary) => summary.id === current)) {
            return current;
          }
          return response[0]?.id ?? null;
        });
      } catch (historyError) {
        if (!cancelled) {
          setError(historyError instanceof Error ? historyError.message : "Unable to load history.");
          setSummaries([]);
          setSelectedStateId(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSummaries(false);
        }
      }
    }

    void loadSummaries();

    return () => {
      cancelled = true;
    };
  }, [agentName, stateStatus, refreshSeed]);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!selectedStateId) {
        setSelectedState(null);
        return;
      }

      setIsLoadingDetail(true);

      try {
        const response = await getFromOrchestrator<AgentStateRead>(
          `/api/v1/agent-states/${selectedStateId}`
        );

        if (!cancelled) {
          setSelectedState(response);
        }
      } catch (detailError) {
        if (!cancelled) {
          setError(detailError instanceof Error ? detailError.message : "Unable to load thread detail.");
          setSelectedState(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedStateId]);

  const latestOutput = useMemo(() => {
    if (!selectedState) {
      return null;
    }

    return [...selectedState.conversation_thread]
      .reverse()
      .find((event) => event.direction === "output")?.payload;
  }, [selectedState]);

  return (
    <Card className="border-emerald-400/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DatabaseZap className="h-5 w-5 text-emerald-300" />
          Saved thread history
        </CardTitle>
        <CardDescription>
          Browse persisted agent runs, filter by workflow, and inspect the stored payloads and tool
          logs behind each thread.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Workflow</span>
            <select
              className={fieldClassName}
              value={agentName}
              onChange={(event) => setAgentName(event.target.value)}
            >
              {agentOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-950">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">State status</span>
            <select
              className={fieldClassName}
              value={stateStatus}
              onChange={(event) => setStateStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-950">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" variant="secondary" onClick={() => setRefreshSeed((value) => value + 1)}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Workflow className="h-4 w-4 text-emerald-300" />
              Recent persisted runs
            </div>

            {isLoadingSummaries ? (
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/45 px-5 py-6 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                Loading saved threads...
              </div>
            ) : summaries.length > 0 ? (
              summaries.map((summary) => {
                const isSelected = summary.id === selectedStateId;
                return (
                  <button
                    key={summary.id}
                    type="button"
                    onClick={() => setSelectedStateId(summary.id)}
                    className={`w-full rounded-3xl border p-5 text-left transition ${
                      isSelected
                        ? "border-emerald-400/35 bg-emerald-400/10"
                        : "border-white/10 bg-slate-950/45 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{summary.agent_name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                          {summary.thread_id}
                        </p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
                        {summary.state_status}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Entity type</p>
                        <p className="mt-2 text-sm text-white">{summary.entity_type}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Latest tool</p>
                        <p className="mt-2 text-sm text-white">{summary.latest_tool ?? "n/a"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
                      <span>{summary.conversation_event_count} events</span>
                      <span>{summary.graph_step_count} graph steps</span>
                      <span>{summary.tool_execution_count} tool logs</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                      <Clock3 className="h-3.5 w-3.5 text-emerald-300" />
                      Updated {new Date(summary.updated_at).toLocaleString()}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-slate-400">
                No persisted threads match the current filters yet. Run a workflow with state
                persistence enabled to populate history.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Search className="h-4 w-4 text-emerald-300" />
              Thread detail
            </div>

            {isLoadingDetail ? (
              <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/45 px-5 py-6 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                Loading thread detail...
              </div>
            ) : selectedState ? (
              <div className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thread ID</p>
                    <p className="mt-2 text-sm font-medium text-white">{selectedState.thread_id}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Workflow</p>
                    <p className="mt-2 text-sm font-medium text-white">{selectedState.agent_name}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Conversation events</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {selectedState.conversation_thread.length}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Graph history</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedState.graph_history.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tool executions</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {selectedState.tool_execution_logs.length}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-medium text-white">Tool log timeline</p>
                    <div className="mt-3 space-y-3">
                      {selectedState.tool_execution_logs.length > 0 ? (
                        selectedState.tool_execution_logs.map((log, index) => (
                          <div key={`${log.tool}-${log.timestamp}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                            <p className="text-sm font-medium text-white">{log.tool ?? "unknown tool"}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "No timestamp"} | {log.status ?? "unknown"}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400">No tool executions persisted for this thread.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <p className="text-sm font-medium text-white">Latest output payload</p>
                    <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs leading-6 text-slate-200">
                      {formatJson(latestOutput)}
                    </pre>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-white">Conversation event log</p>
                  <div className="mt-3 space-y-3">
                    {selectedState.conversation_thread.map((event, index) => (
                      <div
                        key={`${event.timestamp}-${event.direction}-${index}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/60 p-3"
                      >
                        <p className="text-sm font-medium text-white">
                          {(event.direction ?? "event").toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {event.timestamp ? new Date(event.timestamp).toLocaleString() : "No timestamp"}
                        </p>
                        <pre className="mt-3 overflow-x-auto text-xs leading-6 text-slate-200">
                          {formatJson(event.payload)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 px-5 py-6 text-sm text-slate-400">
                Select a saved thread to inspect its persisted state.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
