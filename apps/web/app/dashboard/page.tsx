import Link from "next/link";
import { ArrowLeft, BarChart3, BrainCircuit, Workflow } from "lucide-react";

import { ArDiscoveryPanel } from "@/components/dashboard/ar-discovery-panel";
import { MarketingPrPanel } from "@/components/dashboard/marketing-pr-panel";
import { VirtualManagerPanel } from "@/components/dashboard/virtual-manager-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const dashboardStats = [
  {
    label: "Live workflows",
    value: "3",
    description: "A&R Discovery, Virtual Manager, and Marketing & PR Crew are wired to the orchestrator.",
    icon: Workflow
  },
  {
    label: "Stateful memory",
    value: "agent_states",
    description: "Each workflow can persist thread history into the backend memory table.",
    icon: BrainCircuit
  },
  {
    label: "Operator mode",
    value: "Dashboard",
    description: "Structured forms let label operators trigger and inspect agent output in-app.",
    icon: BarChart3
  }
];

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10">
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              Dashboard workflows live
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Agent Operations Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Run scouting scans, release strategy generation, and a full marketing pipeline
                directly from the frontend, with typed responses flowing back from the FastAPI
                orchestration layer.
              </p>
            </div>
          </div>

          <Button asChild variant="secondary" size="lg">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to overview
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {dashboardStats.map(({ label, value, description, icon: Icon }) => (
            <Card key={label}>
              <CardHeader>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <Icon className="h-5 w-5 text-emerald-300" />
                </div>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-white">{value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-300">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8">
        <ArDiscoveryPanel />
        <VirtualManagerPanel />
        <MarketingPrPanel />
      </section>
    </main>
  );
}
