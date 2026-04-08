import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
} from "lucide-react";
import { PlannerOutputs, IndustryBenchmarks, PlannerConfig } from "@/hooks/useROIPlanner";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  tooltip: string;
  formula?: string;
  calculation?: string;
  trend?: "good" | "warning" | "bad" | "neutral";
  subtitle?: string;
  isHighlighted?: boolean;
}

function MetricCard({
  title,
  value,
  icon,
  tooltip,
  formula,
  calculation,
  trend = "neutral",
  subtitle,
  isHighlighted = false,
}: MetricCardProps) {
  const trendColors = {
    good: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    bad: "border-destructive/30 bg-destructive/5",
    neutral: "border-border",
  };

  const trendIcons = {
    good: <CheckCircle2 className="h-4 w-4 text-success" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning" />,
    bad: <XCircle className="h-4 w-4 text-destructive" />,
    neutral: null,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={cn(
              "cursor-help transition-all hover:shadow-md border-2",
              trendColors[trend],
              isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
            )}
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-2 rounded-lg bg-muted transition-colors",
                  isHighlighted && "bg-primary/20"
                )}>
                  {icon}
                </div>
                {trendIcons[trend]}
              </div>
              <div className="mt-3">
                <p className={cn(
                  "text-2xl font-bold transition-colors",
                  isHighlighted && "text-primary"
                )}>
                  {value}
                </p>
                <p className="text-sm text-muted-foreground">{title}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {subtitle}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[320px]">
          <div className="space-y-2">
            <p className="text-xs">{tooltip}</p>
            {formula && (
              <>
                <div className="border-t border-border/50 pt-2">
                  <p className="text-[10px] text-muted-foreground font-medium">Formula:</p>
                  <p className="text-xs font-mono">{formula}</p>
                </div>
                {calculation && (
                  <p className="text-xs font-mono text-primary">= {calculation}</p>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface PlannerDashboardProps {
  outputs: PlannerOutputs;
  benchmarks: IndustryBenchmarks;
  config: PlannerConfig;
  changedMetrics?: Set<string>;
  mode?: "goal-led" | "budget-led";
}

export function PlannerDashboard({
  outputs,
  benchmarks,
  config,
  changedMetrics = new Set(),
  mode = "goal-led",
}: PlannerDashboardProps) {
  const isChanged = (key: string) => changedMetrics.has(key);
  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));

  // Determine trends based on benchmarks
  const ltvCacTrend: "good" | "warning" | "bad" =
    outputs.ltvCacRatio >= benchmarks.targetLtvCacRatio
      ? "good"
      : outputs.ltvCacRatio >= 2
      ? "warning"
      : "bad";

  const paybackTrend: "good" | "warning" | "bad" =
    outputs.cacPaybackMonths <= benchmarks.targetCacPayback
      ? "good"
      : outputs.cacPaybackMonths <= 18
      ? "warning"
      : "bad";

  // Use new gap analysis from outputs
  const { gapAnalysis } = outputs;
  const pipelineRatio = Number.isFinite(gapAnalysis.pipelineCoverage) ? gapAnalysis.pipelineCoverage : 0;

  return (
    <div className="space-y-6">
      {/* Performance Summary - Consolidated Key Metrics + Gap Analysis */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Performance Summary
        </h3>
        
        {/* Key Metrics Row - Ordered by Funnel Flow: Leads → Deals → Pipeline → ARR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <MetricCard
            title="Total Leads"
            value={formatNumber(outputs.totalLeads)}
            icon={<Users className="h-5 w-5 text-chart-2" />}
            tooltip="Total leads required to hit target based on funnel conversion rates."
            formula={mode === "goal-led" 
              ? "Deals ÷ (L→MQL × MQL→SAL × SAL→SQL × SQL→Close)"
              : "Budget ÷ Cost per Lead"}
            calculation={mode === "goal-led"
              ? `${formatNumber(outputs.totalDeals)} ÷ (${config.leadToMql}% × ${config.mqlToSal}% × ${config.salToSql}% × ${config.opportunityToClose}%)`
              : `${formatCurrency(outputs.paidMediaBudget)} ÷ ${formatCurrency(config.costPerLead)}`}
            isHighlighted={isChanged("totalLeads")}
          />
          <MetricCard
            title="Closed Deals"
            value={formatNumber(outputs.totalDeals)}
            icon={<Target className="h-5 w-5 text-chart-3" />}
            tooltip="Total closed-won deals from the marketing funnel."
            formula="SQLs × Win Rate"
            calculation={`${formatNumber(outputs.funnel.sqls)} × ${config.opportunityToClose}% = ${formatNumber(outputs.totalDeals)}`}
            isHighlighted={isChanged("totalDeals")}
          />
          <MetricCard
            title="Yearly Pipeline"
            value={formatCurrency(outputs.yearlyPipeline)}
            icon={<Activity className="h-5 w-5 text-chart-5" />}
            tooltip="Total projected pipeline value for the year."
            formula="(SQLs × Win Rate × ACV) ÷ Sales Cycle Days × 365"
            calculation={`(${formatNumber(outputs.funnel.sqls)} × ${config.opportunityToClose}% × ${formatCurrency(config.acv)}) ÷ ${config.salesCycleDays} × 365`}
            subtitle={`${pipelineRatio.toFixed(1)}x coverage`}
            isHighlighted={isChanged("pipelineVelocity")}
          />
          <MetricCard
            title="Marketing ARR"
            value={formatCurrency(outputs.newARR)}
            icon={<DollarSign className="h-5 w-5 text-chart-1" />}
            tooltip="Marketing-Attributed ARR generated from closed deals."
            formula="Closed Deals × ACV"
            calculation={`${formatNumber(outputs.totalDeals)} × ${formatCurrency(config.acv)} = ${formatCurrency(outputs.newARR)}`}
            trend={outputs.newARR > 0 ? "good" : "neutral"}
            isHighlighted={isChanged("newARR")}
          />
        </div>

        {/* Gap Indicators */}
        <Card className={cn(
          "transition-all",
          (isChanged("newARR") || isChanged("pipelineVelocity")) && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
        )}>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Budget Gap */}
              <div className={cn(
                "text-center p-4 rounded-lg border-2",
                gapAnalysis.budgetGap > 0 
                  ? "bg-warning/10 border-warning/30" 
                  : "bg-success/10 border-success/30"
              )}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-xs text-muted-foreground">Budget Gap</p>
                  {gapAnalysis.budgetGap > 0 ? (
                    <AlertTriangle className="h-3 w-3 text-warning" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  )}
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  gapAnalysis.budgetGap > 0 ? "text-warning" : "text-success"
                )}>
                  {gapAnalysis.budgetGap > 0 
                    ? `+${formatCurrency(gapAnalysis.budgetGap)}` 
                    : "On Budget ✓"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {gapAnalysis.budgetGap > 0 ? "Additional spend needed" : "Budget sufficient"}
                </p>
              </div>

              {/* Pipeline Gap */}
              <div className={cn(
                "text-center p-4 rounded-lg border-2",
                gapAnalysis.pipelineGap > 0 
                  ? "bg-warning/10 border-warning/30" 
                  : "bg-success/10 border-success/30"
              )}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <p className="text-xs text-muted-foreground">Pipeline Gap ({pipelineRatio.toFixed(1)}x)</p>
                  {gapAnalysis.pipelineGap > 0 ? (
                    <AlertTriangle className="h-3 w-3 text-warning" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-success" />
                  )}
                </div>
                <p className={cn(
                  "text-2xl font-bold",
                  gapAnalysis.pipelineGap > 0 ? "text-warning" : "text-success"
                )}>
                  {gapAnalysis.pipelineGap > 0 
                    ? `+${formatCurrency(gapAnalysis.pipelineGap)}` 
                    : "On Track ✓"
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {gapAnalysis.pipelineGap > 0 ? "Shortfall vs 3x target" : "Exceeds 3x target"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Economics & Costs - Merged Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Unit Economics & Costs
        </h3>
        <Card>
          <CardContent className="pt-4">
            {/* Cost breakdown row */}
            <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Cost/Lead</p>
                <p className={cn(
                  "text-lg font-bold",
                  isChanged("costPerLead") && "text-primary"
                )}>{formatCurrency(outputs.costPerLead)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Cost/MQL</p>
                <p className={cn(
                  "text-lg font-bold",
                  isChanged("costPerMql") && "text-primary"
                )}>{formatCurrency(outputs.costPerMql)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Cost/Opp</p>
                <p className={cn(
                  "text-lg font-bold",
                  isChanged("costPerOpportunity") && "text-primary"
                )}>{formatCurrency(outputs.costPerOpportunity)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Full CAC</p>
                <p className={cn(
                  "text-lg font-bold",
                  isChanged("cac") && "text-primary"
                )}>{formatCurrency(outputs.cac)}</p>
              </div>
            </div>

            {/* Unit economics row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">LTV</p>
                <p className={cn(
                  "text-xl font-bold",
                  isChanged("ltv") && "text-primary"
                )}>{formatCurrency(outputs.ltv)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">LTV:CAC</p>
                <p className={cn(
                  "text-xl font-bold",
                  ltvCacTrend === "good" ? "text-success" : ltvCacTrend === "warning" ? "text-warning" : "text-destructive"
                )}>
                  {outputs.ltvCacRatio.toFixed(1)}:1
                </p>
                <p className="text-xs text-muted-foreground">Target: {benchmarks.targetLtvCacRatio}:1</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">CAC Payback</p>
                <p className={cn(
                  "text-xl font-bold flex items-center justify-center gap-1",
                  paybackTrend === "good" ? "text-success" : paybackTrend === "warning" ? "text-warning" : "text-destructive"
                )}>
                  <Clock className="h-4 w-4" />
                  {outputs.cacPaybackMonths.toFixed(0)} mo
                </p>
                <p className="text-xs text-muted-foreground">Target: ≤{benchmarks.targetCacPayback} mo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}