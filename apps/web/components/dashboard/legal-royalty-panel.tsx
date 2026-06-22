"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Gavel,
  Loader2,
  RefreshCcw,
  Plus,
  ReceiptText,
  Scale,
  Search,
  ShieldCheck,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type {
  AgentStateHistorySummary,
  AgentStateRead,
  CopyrightChecklistInput,
  LegalApprovalCheckpointResponse,
  LegalRoyaltyResponse,
  SplitSheetLineItem
} from "@/lib/agent-types";
import { getFromOrchestrator, postToOrchestrator } from "@/lib/orchestrator-client";

const fieldClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/50";
const labelClassName = "text-sm font-medium text-slate-200";

function createSplitLine(overrides?: Partial<SplitSheetLineItem>): SplitSheetLineItem {
  return {
    party_name: "",
    role: "artist",
    ownership_percent: "0.00",
    recoupable: true,
    contact_email: "",
    ...overrides
  };
}

function formatCurrency(value: string) {
  return Number(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD"
  });
}

const DEFAULT_COPYRIGHT_CHECKLIST: CopyrightChecklistInput = {
  has_human_written_lyrics: true,
  has_human_composed_melody: true,
  has_human_arranged_structure: true,
  ai_generated_lyrics: true,
  ai_generated_melody: false,
  ai_generated_master_audio: false,
  ai_generated_artwork: true,
  human_edited_ai_material: true,
  source_material_rights_cleared: true,
  contributor_agreements_collected: false,
  splits_confirmed_by_all_parties: false
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeSplitSheet(value: unknown): SplitSheetLineItem[] {
  if (!Array.isArray(value)) {
    return [createSplitLine()];
  }

  const items = value
    .map((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      return createSplitLine({
        party_name: asString(entry.party_name),
        role: asString(entry.role, "artist"),
        ownership_percent: asString(entry.ownership_percent, "0.00"),
        recoupable: asBoolean(entry.recoupable, true),
        contact_email: asString(entry.contact_email)
      });
    })
    .filter((entry): entry is SplitSheetLineItem => entry !== null);

  return items.length > 0 ? items : [createSplitLine()];
}

function normalizeChecklist(value: unknown): CopyrightChecklistInput {
  if (!isRecord(value)) {
    return DEFAULT_COPYRIGHT_CHECKLIST;
  }

  return {
    has_human_written_lyrics: asBoolean(
      value.has_human_written_lyrics,
      DEFAULT_COPYRIGHT_CHECKLIST.has_human_written_lyrics
    ),
    has_human_composed_melody: asBoolean(
      value.has_human_composed_melody,
      DEFAULT_COPYRIGHT_CHECKLIST.has_human_composed_melody
    ),
    has_human_arranged_structure: asBoolean(
      value.has_human_arranged_structure,
      DEFAULT_COPYRIGHT_CHECKLIST.has_human_arranged_structure
    ),
    ai_generated_lyrics: asBoolean(
      value.ai_generated_lyrics,
      DEFAULT_COPYRIGHT_CHECKLIST.ai_generated_lyrics
    ),
    ai_generated_melody: asBoolean(
      value.ai_generated_melody,
      DEFAULT_COPYRIGHT_CHECKLIST.ai_generated_melody
    ),
    ai_generated_master_audio: asBoolean(
      value.ai_generated_master_audio,
      DEFAULT_COPYRIGHT_CHECKLIST.ai_generated_master_audio
    ),
    ai_generated_artwork: asBoolean(
      value.ai_generated_artwork,
      DEFAULT_COPYRIGHT_CHECKLIST.ai_generated_artwork
    ),
    human_edited_ai_material: asBoolean(
      value.human_edited_ai_material,
      DEFAULT_COPYRIGHT_CHECKLIST.human_edited_ai_material
    ),
    source_material_rights_cleared: asBoolean(
      value.source_material_rights_cleared,
      DEFAULT_COPYRIGHT_CHECKLIST.source_material_rights_cleared
    ),
    contributor_agreements_collected: asBoolean(
      value.contributor_agreements_collected,
      DEFAULT_COPYRIGHT_CHECKLIST.contributor_agreements_collected
    ),
    splits_confirmed_by_all_parties: asBoolean(
      value.splits_confirmed_by_all_parties,
      DEFAULT_COPYRIGHT_CHECKLIST.splits_confirmed_by_all_parties
    )
  };
}

export function LegalRoyaltyPanel() {
  const [artistName, setArtistName] = useState("Nova Bloom");
  const [trackTitle, setTrackTitle] = useState("Midnight Relay");
  const [contractReference, setContractReference] = useState("LBL-2026-001");
  const [grossRevenue, setGrossRevenue] = useState("10000.00");
  const [royaltyPoolRate, setRoyaltyPoolRate] = useState("0.80000");
  const [distributionFeeRate, setDistributionFeeRate] = useState("0.10000");
  const [advanceAmount, setAdvanceAmount] = useState("2000.00");
  const [priorUnrecoupedBalance, setPriorUnrecoupedBalance] = useState("1000.00");
  const [recoupmentRate, setRecoupmentRate] = useState("0.50000");
  const [persistState, setPersistState] = useState(true);
  const [threadId, setThreadId] = useState("");
  const [threadLookupId, setThreadLookupId] = useState("");
  const [copyrightChecklist, setCopyrightChecklist] =
    useState<CopyrightChecklistInput>(DEFAULT_COPYRIGHT_CHECKLIST);
  const [splitSheet, setSplitSheet] = useState<SplitSheetLineItem[]>([
    createSplitLine({
      party_name: "Nova Bloom",
      role: "artist",
      ownership_percent: "60.00",
      recoupable: true,
      contact_email: "nova@example.com"
    }),
    createSplitLine({
      party_name: "Signal Works",
      role: "producer",
      ownership_percent: "25.00",
      recoupable: true,
      contact_email: "signal@example.com"
    }),
    createSplitLine({
      party_name: "Nova Bloom",
      role: "writer",
      ownership_percent: "10.00",
      recoupable: false,
      contact_email: "nova-writer@example.com"
    })
  ]);
  const [result, setResult] = useState<LegalRoyaltyResponse | null>(null);
  const [approvalResult, setApprovalResult] = useState<LegalApprovalCheckpointResponse | null>(null);
  const [currentReviewStatus, setCurrentReviewStatus] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState("Casey Morgan");
  const [reviewerRole, setReviewerRole] = useState("Label Counsel");
  const [reviewerNotes, setReviewerNotes] = useState(
    "Reviewed copyright checklist and payout waterfall."
  );
  const [legalHistory, setLegalHistory] = useState<AgentStateHistorySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApplyingCheckpoint, setIsApplyingCheckpoint] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const declaredTotal = useMemo(
    () =>
      splitSheet.reduce((sum, item) => {
        const numericValue = Number(item.ownership_percent);
        return sum + (Number.isFinite(numericValue) ? numericValue : 0);
      }, 0),
    [splitSheet]
  );

  const simulationFields: Array<{
    label: string;
    value: string;
    setValue: (value: string) => void;
  }> = [
    { label: "Gross revenue", value: grossRevenue, setValue: setGrossRevenue },
    { label: "Royalty pool rate", value: royaltyPoolRate, setValue: setRoyaltyPoolRate },
    {
      label: "Distribution fee rate",
      value: distributionFeeRate,
      setValue: setDistributionFeeRate
    },
    { label: "Advance amount", value: advanceAmount, setValue: setAdvanceAmount },
    {
      label: "Prior unrecouped balance",
      value: priorUnrecoupedBalance,
      setValue: setPriorUnrecoupedBalance
    },
    { label: "Recoupment rate", value: recoupmentRate, setValue: setRecoupmentRate }
  ];
  const checklistFields: Array<{
    key: keyof CopyrightChecklistInput;
    label: string;
    description: string;
  }> = [
    {
      key: "has_human_written_lyrics",
      label: "Human-written lyrics",
      description: "Lyrics contain qualifying human-authored expression."
    },
    {
      key: "has_human_composed_melody",
      label: "Human-composed melody",
      description: "Melodic composition originates from a human contributor."
    },
    {
      key: "has_human_arranged_structure",
      label: "Human-arranged structure",
      description: "Arrangement, sequence, or structure was creatively shaped by a human."
    },
    {
      key: "ai_generated_lyrics",
      label: "AI-generated lyrics involved",
      description: "Language model or text generation contributed lyrical content."
    },
    {
      key: "ai_generated_melody",
      label: "AI-generated melody involved",
      description: "Generative tooling contributed melodic material."
    },
    {
      key: "ai_generated_master_audio",
      label: "AI-generated master audio involved",
      description: "The sound recording includes machine-generated audio output."
    },
    {
      key: "ai_generated_artwork",
      label: "AI-generated artwork involved",
      description: "Artwork or key campaign visuals include AI-generated elements."
    },
    {
      key: "human_edited_ai_material",
      label: "Human edited AI material",
      description: "Humans materially curated, edited, or transformed AI-assisted output."
    },
    {
      key: "source_material_rights_cleared",
      label: "Source rights cleared",
      description: "Samples, interpolations, or underlying works are documented as cleared."
    },
    {
      key: "contributor_agreements_collected",
      label: "Contributor agreements collected",
      description: "All contributors have signed supporting agreements or deal memos."
    },
    {
      key: "splits_confirmed_by_all_parties",
      label: "Splits confirmed by all parties",
      description: "Every party has explicitly confirmed the split allocations."
    }
  ];

  const loadLegalHistory = async () => {
    setLoadError(null);
    setIsLoadingHistory(true);

    try {
      const response = await getFromOrchestrator<AgentStateHistorySummary[]>(
        "/api/v1/agents/history?agent_name=legal-royalty&limit=8"
      );
      setLegalHistory(response);
    } catch (historyError) {
      setLoadError(
        historyError instanceof Error ? historyError.message : "Unable to load legal thread history."
      );
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadLegalHistory();
  }, []);

  const updateLineItem = <K extends keyof SplitSheetLineItem>(
    index: number,
    key: K,
    value: SplitSheetLineItem[K]
  ) => {
    setSplitSheet((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index ? { ...line, [key]: value } : line
      )
    );
  };

  const updateChecklistField = (
    key: keyof CopyrightChecklistInput,
    value: boolean
  ) => {
    setCopyrightChecklist((current) => ({
      ...current,
      [key]: value
    }));
  };

  const hydrateFromThreadState = (state: AgentStateRead) => {
    const latestInputEvent = [...state.conversation_thread]
      .reverse()
      .find((event) => event.direction === "input");
    const latestOutputEvent = [...state.conversation_thread]
      .reverse()
      .find((event) => event.direction === "output");
    const latestCheckpointEvent = [...state.conversation_thread]
      .reverse()
      .find((event) => event.direction === "checkpoint");

    if (isRecord(latestInputEvent?.payload)) {
      const payload = latestInputEvent.payload;
      setArtistName(asString(payload.artist_name, artistName));
      setTrackTitle(asString(payload.track_title, trackTitle));
      setContractReference(asString(payload.contract_reference));
      setGrossRevenue(asString(payload.gross_revenue, grossRevenue));
      setRoyaltyPoolRate(asString(payload.royalty_pool_rate, royaltyPoolRate));
      setDistributionFeeRate(asString(payload.distribution_fee_rate, distributionFeeRate));
      setAdvanceAmount(asString(payload.advance_amount, advanceAmount));
      setPriorUnrecoupedBalance(
        asString(payload.prior_unrecouped_balance, priorUnrecoupedBalance)
      );
      setRecoupmentRate(asString(payload.recoupment_rate, recoupmentRate));
      setPersistState(asBoolean(payload.persist_state, true));
      setSplitSheet(normalizeSplitSheet(payload.split_sheet));
      setCopyrightChecklist(normalizeChecklist(payload.copyright_checklist));
    }

    if (isRecord(latestOutputEvent?.payload)) {
      setResult({
        ...(latestOutputEvent.payload as LegalRoyaltyResponse),
        state_id: state.id
      });
    } else {
      setResult(null);
    }

    if (isRecord(latestCheckpointEvent?.payload)) {
      setApprovalResult({
        state_id: state.id,
        thread_id: state.thread_id,
        previous_status: asString(latestCheckpointEvent.payload.previous_status),
        new_status: state.state_status,
        reviewer_name: asString(latestCheckpointEvent.payload.reviewer_name),
        reviewer_role: asString(latestCheckpointEvent.payload.reviewer_role),
        notes: asString(latestCheckpointEvent.payload.notes),
        recorded_at: asString(
          latestCheckpointEvent.payload.recorded_at,
          latestCheckpointEvent.timestamp ?? new Date().toISOString()
        )
      });
      setReviewerName(asString(latestCheckpointEvent.payload.reviewer_name, reviewerName));
      setReviewerRole(asString(latestCheckpointEvent.payload.reviewer_role, reviewerRole));
      setReviewerNotes(asString(latestCheckpointEvent.payload.notes, reviewerNotes));
    } else {
      setApprovalResult(null);
    }

    setThreadId(state.thread_id);
    setThreadLookupId(state.thread_id);
    setCurrentReviewStatus(state.state_status);
    setApprovalError(null);
    setError(null);
  };

  const loadPersistedThread = async (requestedThreadId: string) => {
    const normalizedThreadId = requestedThreadId.trim();
    if (!normalizedThreadId) {
      setLoadError("Enter a legal thread ID to load a persisted review.");
      return;
    }

    setLoadError(null);
    setIsLoadingThread(true);

    try {
      const state = await getFromOrchestrator<AgentStateRead>(
        `/api/v1/agents/legal-royalty/threads/${encodeURIComponent(normalizedThreadId)}`
      );
      hydrateFromThreadState(state);
    } catch (threadError) {
      setLoadError(
        threadError instanceof Error ? threadError.message : "Unable to load legal thread."
      );
    } finally {
      setIsLoadingThread(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await postToOrchestrator<LegalRoyaltyResponse, object>(
        "/api/v1/agents/legal-royalty/evaluate-contract",
        {
          artist_name: artistName,
          track_title: trackTitle,
          contract_reference: contractReference || null,
          split_sheet: splitSheet.map((line) => ({
            ...line,
            contact_email: line.contact_email?.trim() ? line.contact_email.trim() : null
          })),
          gross_revenue: grossRevenue,
          royalty_pool_rate: royaltyPoolRate,
          distribution_fee_rate: distributionFeeRate,
          advance_amount: advanceAmount,
          prior_unrecouped_balance: priorUnrecoupedBalance,
          recoupment_rate: recoupmentRate,
          copyright_checklist: copyrightChecklist,
          persist_state: persistState,
          thread_id: threadId.trim() || null
        }
      );

      setResult(response);
      setApprovalResult(null);
      setThreadId(response.thread_id);
      setThreadLookupId(response.thread_id);
      setCurrentReviewStatus(
        persistState ? (response.requires_human_review ? "human-review-required" : "completed") : null
      );
      void loadLegalHistory();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unknown error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyCheckpoint = async (decision: "approved" | "needs-revision" | "rejected") => {
    if (!result?.thread_id) {
      return;
    }

    setApprovalError(null);
    setIsApplyingCheckpoint(true);

    try {
      const response = await postToOrchestrator<LegalApprovalCheckpointResponse, object>(
        `/api/v1/agents/legal-royalty/threads/${result.thread_id}/checkpoint`,
        {
          decision,
          reviewer_name: reviewerName,
          reviewer_role: reviewerRole,
          notes: reviewerNotes
        }
      );

      setApprovalResult(response);
      setCurrentReviewStatus(response.new_status);
      if (result) {
        setResult({
          ...result,
          state_id: response.state_id
        });
      }
      void loadLegalHistory();
    } catch (checkpointError) {
      setApprovalError(
        checkpointError instanceof Error ? checkpointError.message : "Unknown checkpoint error."
      );
    } finally {
      setIsApplyingCheckpoint(false);
    }
  };

  return (
    <Card className="border-emerald-400/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Scale className="h-5 w-5 text-emerald-300" />
          Legal & Royalty Administration
        </CardTitle>
        <CardDescription>
          Simulate split-sheet validation and recoupment withholding with deterministic contract math.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white">Reload persisted legal thread</p>
              <p className="mt-1 text-sm text-slate-400">
                Pull an existing legal review back into the panel for re-review, edits, or a new
                checkpoint decision.
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadLegalHistory()}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh legal history
            </Button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
            <label className="space-y-2">
              <span className={labelClassName}>Saved thread ID</span>
              <input
                className={fieldClassName}
                value={threadLookupId}
                onChange={(event) => setThreadLookupId(event.target.value)}
                placeholder="legal-royalty-..."
              />
            </label>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => void loadPersistedThread(threadLookupId)}
                disabled={isLoadingThread}
              >
                {isLoadingThread ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Load thread
              </Button>
            </div>
          </div>

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {loadError}
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            <p className="text-sm font-medium text-white">Recent persisted legal runs</p>
            {isLoadingHistory ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                Loading legal thread history...
              </div>
            ) : legalHistory.length > 0 ? (
              legalHistory.map((summary) => (
                <button
                  key={summary.id}
                  type="button"
                  onClick={() => void loadPersistedThread(summary.thread_id)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-left transition hover:border-white/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{summary.thread_id}</p>
                      <p className="mt-1 text-sm text-slate-300">{summary.state_status}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
                      {new Date(summary.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{summary.conversation_event_count} events</span>
                    <span>{summary.tool_execution_count} tool logs</span>
                    <span>{summary.latest_tool ?? "no tool metadata"}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
                No persisted legal threads yet. Save a legal run to make it reloadable here.
              </div>
            )}
          </div>
        </div>

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
              <span className={labelClassName}>Contract reference</span>
              <input
                className={fieldClassName}
                value={contractReference}
                onChange={(event) => setContractReference(event.target.value)}
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {simulationFields.map(({ label, value, setValue }) => (
              <label key={label} className="space-y-2">
                <span className={labelClassName}>{label}</span>
                <input
                  className={fieldClassName}
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Split-sheet line items</p>
                <p className="mt-1 text-sm text-slate-400">
                  Declared total: {declaredTotal.toFixed(2)}% — the workflow will normalize if needed.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSplitSheet((current) => [...current, createSplitLine()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add party
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              {splitSheet.map((line, index) => (
                <div
                  key={`${line.party_name}-${line.role}-${index}`}
                  className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/45 p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-white">Party #{index + 1}</p>
                    {splitSheet.length > 1 ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setSplitSheet((current) =>
                            current.filter((_, lineIndex) => lineIndex !== index)
                          )
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <label className="space-y-2">
                      <span className={labelClassName}>Party name</span>
                      <input
                        className={fieldClassName}
                        value={line.party_name}
                        onChange={(event) =>
                          updateLineItem(index, "party_name", event.target.value)
                        }
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={labelClassName}>Role</span>
                      <input
                        className={fieldClassName}
                        value={line.role}
                        onChange={(event) => updateLineItem(index, "role", event.target.value)}
                      />
                    </label>
                    <label className="space-y-2">
                      <span className={labelClassName}>Ownership %</span>
                      <input
                        className={fieldClassName}
                        value={line.ownership_percent}
                        onChange={(event) =>
                          updateLineItem(index, "ownership_percent", event.target.value)
                        }
                      />
                    </label>
                    <label className="space-y-2 xl:col-span-2">
                      <span className={labelClassName}>Contact email</span>
                      <input
                        className={fieldClassName}
                        value={line.contact_email ?? ""}
                        onChange={(event) =>
                          updateLineItem(index, "contact_email", event.target.value)
                        }
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={line.recoupable}
                      onChange={(event) =>
                        updateLineItem(index, "recoupable", event.target.checked)
                      }
                    />
                    This party participates in recoupment withholding
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Copyright eligibility checklist
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {checklistFields.map(({ key, label, description }) => (
                <label
                  key={key}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm text-slate-200"
                >
                  <input
                    type="checkbox"
                    checked={copyrightChecklist[key]}
                    onChange={(event) => updateChecklistField(key, event.target.checked)}
                  />
                  <div>
                    <p className="font-medium text-white">{label}</p>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={persistState}
              onChange={(event) => setPersistState(event.target.checked)}
            />
            Persist legal workflow state for audit history
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Evaluate contract and simulate recoupment
          </Button>
        </form>

        {result ? (
          <div className="space-y-5 border-t border-white/10 pt-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thread ID</p>
                <p className="mt-2 text-sm font-medium text-white">{result.thread_id}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Persisted state</p>
                <p className="mt-2 text-sm font-medium text-white">{result.state_id ?? "Not persisted"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current status</p>
                <p className="mt-2 text-sm font-medium text-white">{currentReviewStatus ?? "Not persisted"}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Human review</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {result.requires_human_review ? "Required" : "Not required"}
                </p>
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
                Legal summary
              </p>
              <p className="mt-3 text-base leading-7 text-white">{result.legal_summary}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Copyright eligibility
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Eligibility status</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {result.copyright_eligibility.eligibility_status}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">AI disclosure</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {result.copyright_eligibility.ai_disclosure_required ? "Required" : "Not required"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Human review</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {result.copyright_eligibility.requires_human_review ? "Required" : "Not required"}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-5 xl:grid-cols-2">
                <div className="space-y-3">
                  {result.copyright_eligibility.checklist_findings.map((finding) => (
                    <div
                      key={finding.criterion}
                      className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        {finding.passed ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                        ) : (
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{finding.criterion}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                            {finding.severity}
                          </p>
                          <p className="mt-2 text-sm text-slate-300">{finding.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <p className="text-sm font-medium text-white">Filing guidance</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-300">
                    {result.copyright_eligibility.filing_guidance.map((guidance) => (
                      <li key={guidance} className="flex gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                        <span>{guidance}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Gavel className="h-4 w-4 text-emerald-300" />
                Human approval checkpoint
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <label className="space-y-2">
                  <span className={labelClassName}>Reviewer name</span>
                  <input
                    className={fieldClassName}
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                  />
                </label>
                <label className="space-y-2">
                  <span className={labelClassName}>Reviewer role</span>
                  <input
                    className={fieldClassName}
                    value={reviewerRole}
                    onChange={(event) => setReviewerRole(event.target.value)}
                  />
                </label>
                <label className="space-y-2 xl:col-span-1 md:col-span-2">
                  <span className={labelClassName}>Checkpoint notes</span>
                  <input
                    className={fieldClassName}
                    value={reviewerNotes}
                    onChange={(event) => setReviewerNotes(event.target.value)}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => void applyCheckpoint("approved")}
                  disabled={isApplyingCheckpoint || !result.state_id}
                >
                  {isApplyingCheckpoint ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Approve checkpoint
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void applyCheckpoint("needs-revision")}
                  disabled={isApplyingCheckpoint || !result.state_id}
                >
                  Needs revision
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void applyCheckpoint("rejected")}
                  disabled={isApplyingCheckpoint || !result.state_id}
                >
                  Reject
                </Button>
              </div>

              {approvalError ? (
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {approvalError}
                </div>
              ) : null}

              {approvalResult ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-sm font-medium text-white">
                    Approval recorded: {approvalResult.previous_status} → {approvalResult.new_status}
                  </p>
                  <p className="mt-2 text-sm text-slate-200">
                    {approvalResult.reviewer_name} ({approvalResult.reviewer_role}) at{" "}
                    {new Date(approvalResult.recorded_at).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-slate-300">{approvalResult.notes}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-400">
                  Persist the workflow state to enable approval checkpoint actions.
                </p>
              )}
            </div>

            <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Gavel className="h-4 w-4 text-emerald-300" />
                    Split-sheet analysis
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Declared total</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {result.split_sheet_analysis.total_declared_percent}%
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Recoupable parties</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {result.split_sheet_analysis.recoupable_party_count}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {result.split_sheet_analysis.validation_issues.length > 0 ? (
                      result.split_sheet_analysis.validation_issues.map((issue) => (
                        <div
                          key={`${issue.severity}-${issue.message}`}
                          className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4"
                        >
                          <div className="flex gap-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
                            <div>
                              <p className="text-sm font-medium text-white">{issue.severity}</p>
                              <p className="mt-1 text-sm text-slate-200">{issue.message}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                        No validation issues detected. The split sheet passed automated checks.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <ReceiptText className="h-4 w-4 text-emerald-300" />
                    Normalized split sheet
                  </div>
                  <div className="mt-4 space-y-3">
                    {result.split_sheet_analysis.normalized_split_sheet.map((line) => (
                      <div
                        key={`${line.party_name}-${line.role}-${line.contact_email ?? "n/a"}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {line.party_name} - {line.role}
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              Declared: {line.declared_ownership_percent}% | Normalized:{" "}
                              {line.normalized_ownership_percent}%
                            </p>
                          </div>
                          <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
                            {line.recoupable ? "Recoupable" : "Non-recoupable"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Calculator className="h-4 w-4 text-emerald-300" />
                    Recoupment waterfall
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {[
                      ["Gross revenue", result.recoupment_model.gross_revenue],
                      ["Distribution fee", result.recoupment_model.distribution_fee_amount],
                      ["Net receipts", result.recoupment_model.net_receipts],
                      ["Royalty pool", result.recoupment_model.royalty_pool_amount],
                      ["Recoupable balance", result.recoupment_model.total_recoupable_balance],
                      ["Recoupment withheld", result.recoupment_model.recoupment_withheld],
                      ["Remaining unrecouped", result.recoupment_model.remaining_unrecouped_balance],
                      ["Total distributable", result.recoupment_model.total_distributable_amount]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                        <p className="mt-2 text-lg font-semibold text-white">
                          {formatCurrency(String(value))}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Scale className="h-4 w-4 text-emerald-300" />
                    Participant payout allocation
                  </div>
                  <div className="mt-4 space-y-3">
                    {result.recoupment_model.participant_payouts.map((payout) => (
                      <div
                        key={`${payout.party_name}-${payout.role}`}
                        className="rounded-2xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {payout.party_name} - {payout.role}
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              Ownership: {payout.ownership_percent}% |{" "}
                              {payout.recoupable ? "Recoupable" : "Non-recoupable"}
                            </p>
                          </div>
                          <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-200">
                            Net payout {formatCurrency(payout.payout_amount)}
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pre-recoupment</p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {formatCurrency(payout.pre_recoupment_amount)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Withheld</p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {formatCurrency(payout.recoupment_withheld_amount)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Payout</p>
                            <p className="mt-2 text-sm font-medium text-white">
                              {formatCurrency(payout.payout_amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
