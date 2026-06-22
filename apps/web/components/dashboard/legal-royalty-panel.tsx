"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calculator,
  Gavel,
  Loader2,
  Plus,
  ReceiptText,
  Scale,
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
  LegalRoyaltyResponse,
  SplitSheetLineItem
} from "@/lib/agent-types";
import { postToOrchestrator } from "@/lib/orchestrator-client";

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const declaredTotal = useMemo(
    () =>
      splitSheet.reduce((sum, item) => {
        const numericValue = Number(item.ownership_percent);
        return sum + (Number.isFinite(numericValue) ? numericValue : 0);
      }, 0),
    [splitSheet]
  );

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
          <Scale className="h-5 w-5 text-emerald-300" />
          Legal & Royalty Administration
        </CardTitle>
        <CardDescription>
          Simulate split-sheet validation and recoupment withholding with deterministic contract math.
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
            {[
              ["Gross revenue", grossRevenue, setGrossRevenue],
              ["Royalty pool rate", royaltyPoolRate, setRoyaltyPoolRate],
              ["Distribution fee rate", distributionFeeRate, setDistributionFeeRate],
              ["Advance amount", advanceAmount, setAdvanceAmount],
              ["Prior unrecouped balance", priorUnrecoupedBalance, setPriorUnrecoupedBalance],
              ["Recoupment rate", recoupmentRate, setRecoupmentRate]
            ].map(([label, value, setter]) => (
              <label key={label} className="space-y-2">
                <span className={labelClassName}>{label}</span>
                <input
                  className={fieldClassName}
                  value={value}
                  onChange={(event) => (setter as (value: string) => void)(event.target.value)}
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
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thread ID</p>
                <p className="mt-2 text-sm font-medium text-white">{result.thread_id}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Persisted state</p>
                <p className="mt-2 text-sm font-medium text-white">{result.state_id ?? "Not persisted"}</p>
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
