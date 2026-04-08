import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Presentation, Printer, X } from "lucide-react";
import { PlannerOutputs, PlannerConfig, PlanningMode } from "@/hooks/useROIPlanner";

interface PresentationViewProps {
  outputs: PlannerOutputs;
  config: PlannerConfig;
  mode: PlanningMode;
  targetARR: number;
  yearlyBudget: number;
}

export function PresentationView({
  outputs,
  config,
  mode,
  targetARR,
  yearlyBudget,
}: PresentationViewProps) {
  const [open, setOpen] = useState(false);

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCompact = (value: number) => {
    if (!Number.isFinite(value)) return "$0";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));

  const handlePrint = () => {
    window.print();
  };

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const okrs = [
    {
      objective: "Revenue",
      keyResult: `Generate ${formatCurrency(outputs.newARR)} marketing-sourced ARR via ${formatNumber(outputs.totalDeals)} closed deals`,
    },
    {
      objective: "Pipeline",
      keyResult: `Build ${formatCurrency(outputs.yearlyPipeline)} pipeline from ${formatNumber(outputs.totalLeads)} leads`,
    },
    {
      objective: "Efficiency",
      keyResult: `Achieve ${formatCurrency(outputs.cac)} CAC with ${outputs.ltvCacRatio.toFixed(1)}:1 LTV:CAC ratio`,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Presentation className="h-4 w-4 mr-2" />
          Present
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[800px] max-h-[90vh] overflow-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle>Presentation View</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Printable Content */}
        <div className="print:p-8 space-y-6">
          {/* Header */}
          <div className="text-center border-b pb-6">
            <h1 className="text-3xl font-bold mb-2">Growth Plan Summary</h1>
            <p className="text-muted-foreground">{date}</p>
          </div>

          {/* Mode and Targets */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Mode</p>
                <p className="text-lg font-semibold">
                  {mode === "goal-led" ? "Goal-Led" : "Budget-Led"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Target ARR</p>
                <p className="text-lg font-semibold">{formatCompact(targetARR)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
                <p className="text-lg font-semibold">{formatCompact(yearlyBudget)}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Key Metrics</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-chart-1/10 rounded-lg">
                <p className="text-2xl font-bold text-chart-1">
                  {formatCompact(outputs.newARR)}
                </p>
                <p className="text-xs text-muted-foreground">Marketing ARR</p>
              </div>
              <div className="text-center p-4 bg-chart-2/10 rounded-lg">
                <p className="text-2xl font-bold text-chart-2">
                  {formatNumber(outputs.totalLeads)}
                </p>
                <p className="text-xs text-muted-foreground">Total Leads</p>
              </div>
              <div className="text-center p-4 bg-chart-3/10 rounded-lg">
                <p className="text-2xl font-bold text-chart-3">
                  {formatNumber(outputs.totalDeals)}
                </p>
                <p className="text-xs text-muted-foreground">Closed Deals</p>
              </div>
              <div className="text-center p-4 bg-chart-4/10 rounded-lg">
                <p className="text-2xl font-bold text-chart-4">
                  {formatCompact(outputs.yearlyPipeline)}
                </p>
                <p className="text-xs text-muted-foreground">Pipeline</p>
              </div>
            </div>
          </div>

          {/* OKRs */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Marketing Objectives</h2>
            <div className="space-y-3">
              {okrs.map((okr, index) => (
                <div
                  key={okr.objective}
                  className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{okr.objective}</p>
                    <p className="text-sm text-muted-foreground">{okr.keyResult}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Unit Economics Snapshot */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Unit Economics</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold">{formatCurrency(outputs.cac)}</p>
                <p className="text-xs text-muted-foreground">Full CAC</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold">{formatCurrency(outputs.ltv)}</p>
                <p className="text-xs text-muted-foreground">LTV</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold">{outputs.ltvCacRatio.toFixed(1)}:1</p>
                <p className="text-xs text-muted-foreground">LTV:CAC</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-bold">{outputs.cacPaybackMonths.toFixed(0)} mo</p>
                <p className="text-xs text-muted-foreground">CAC Payback</p>
              </div>
            </div>
          </div>

          {/* Funnel Summary */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Funnel Summary</h2>
            <div className="flex items-center justify-between gap-2">
              {[
                { label: "Leads", value: outputs.funnel.leads },
                { label: "MQLs", value: outputs.funnel.mqls },
                { label: "SALs", value: outputs.funnel.sals },
                { label: "SQLs", value: outputs.funnel.sqls },
                { label: "Won", value: outputs.funnel.closedWon },
              ].map((stage, index, arr) => (
                <div key={stage.label} className="flex items-center gap-2">
                  <div className="text-center p-3 bg-muted/50 rounded-lg min-w-[80px]">
                    <p className="text-lg font-bold">{formatNumber(stage.value)}</p>
                    <p className="text-xs text-muted-foreground">{stage.label}</p>
                  </div>
                  {index < arr.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footnote */}
          <div className="border-t pt-4 mt-6">
            <p className="text-xs text-muted-foreground text-center">
              Model assumptions: 3× pipeline coverage target, 5-year LTV cap, 12-month CAC payback benchmark.
              <br />
              Conversion benchmarks based on B2B SaaS industry averages.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
