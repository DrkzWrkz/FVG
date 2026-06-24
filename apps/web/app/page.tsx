import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Database,
  Megaphone,
  Music4,
  RadioTower,
  Scale,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const orgChart = [
  {
    title: "A&R Discovery Agent",
    description:
      "Simulates social telemetry and acoustic matching to flag fast-rising independent assets.",
    icon: RadioTower
  },
  {
    title: "Autonomous Virtual Manager",
    description:
      "Builds six-week release roadmaps with structured social, pitching, and fan retention outputs.",
    icon: Music4
  },
  {
    title: "Marketing & PR Crew",
    description:
      "Chains market research, copy generation, and semantic media outreach in a linear multi-agent workflow.",
    icon: Megaphone
  },
  {
    title: "Legal & Royalty Administration",
    description:
      "Runs deterministic split, recoupment, and copyright workflows with human-in-the-loop checkpoints.",
    icon: Scale
  }
];

const databaseTables = [
  "artists",
  "tracks",
  "contracts",
  "agent_states"
];

const apiRoutes = [
  "GET /healthz",
  "GET /api/v1/agents/org-chart",
  "GET /api/v1/foundation/database",
  "GET /api/v1/agents/history",
  "POST /api/v1/agents/ar-discovery/scan",
  "POST /api/v1/agents/virtual-manager/release-plan",
  "POST /api/v1/agents/marketing-pr/launch-campaign",
  "POST /api/v1/agents/legal-royalty/ingest-document",
  "POST /api/v1/agents/legal-royalty/evaluate-contract",
  "POST /api/v1/agents/legal-royalty/threads/{thread_id}/checkpoint",
  "POST /api/v1/artists/intake-preview",
  "POST /api/v1/tracks/intake-preview",
  "POST /api/v1/contracts/intake-preview",
  "POST /api/v1/agent-states/intake-preview"
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:px-10">
      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
            <Sparkles className="h-4 w-4" />
            Foundation and dashboard workflows initialized
          </div>
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              SaaS Music Management AI-Powered Autonomous Record Label
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              A multi-agent platform that mirrors a traditional label org chart with modular AI
              systems, deterministic royalty logic, and semantic memory layers for artist growth.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Open agent dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/api/health">Inspect frontend health route</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">
                Open FastAPI docs
              </a>
            </Button>
          </div>
        </div>

        <Card className="border-emerald-400/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BadgeCheck className="h-5 w-5 text-emerald-300" />
              Initial delivery
            </CardTitle>
            <CardDescription>
              The repo begins with the shared workspace, API surface, schema migration, and UI
              shell required for incremental feature delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="font-medium text-white">Tech stack</p>
              <p className="mt-2">Next.js, Tailwind CSS, FastAPI, PostgreSQL, pgvector, Qdrant-ready services.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="font-medium text-white">Implementation posture</p>
              <p className="mt-2">LLM-facing orchestration is separated from deterministic contract and royalty logic.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="font-medium text-white">Live workflows</p>
              <p className="mt-2">A&R Discovery, Virtual Manager, Marketing & PR Crew, Legal & Royalty simulations, and saved thread history are now wired into a usable frontend dashboard.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {orgChart.map(({ title, description, icon: Icon }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Icon className="h-5 w-5 text-emerald-300" />
              </div>
              <CardTitle className="text-white">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-5 w-5 text-emerald-300" />
              Database foundation
            </CardTitle>
            <CardDescription>
              PostgreSQL schema has been initialized for the first contractual and operational
              entities.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {databaseTables.map((table) => (
              <div
                key={table}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-sm text-slate-200"
              >
                {table}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-white">Core API entry points</CardTitle>
            <CardDescription>
              The orchestration service exposes the first integration-ready foundation routes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {apiRoutes.map((route) => (
              <div
                key={route}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 font-mono text-sm text-slate-200"
              >
                {route}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
