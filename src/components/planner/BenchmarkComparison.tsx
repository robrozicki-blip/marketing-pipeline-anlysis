import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { PlannerConfig, IndustryBenchmarks, PlannerOutputs } from "@/hooks/useROIPlanner";

interface BenchmarkComparisonProps {
  config: PlannerConfig;
  outputs: PlannerOutputs;
  benchmarks: IndustryBenchmarks;
}

interface ComparisonRow {
  metric: string;
  yourValue: number;
  benchmark: number;
  format: "percent" | "ratio" | "months" | "currency";
  higherIsBetter: boolean;
  tooltip: string;
}

export function BenchmarkComparison({
  config,
  outputs,
  benchmarks,
}: BenchmarkComparisonProps) {
  // Calculate overall lead-to-close rate with safe fallbacks
  const overallLeadToClose =
    ((config.leadToMql ?? 0) / 100) *
    ((config.mqlToSal ?? 0) / 100) *
    ((config.salToSql ?? 0) / 100) *
    ((config.opportunityToClose ?? 0) / 100) *
    100;

  // Simplified comparisons - only summary metrics (funnel rates shown in MarketingFunnel)
  const comparisons: ComparisonRow[] = [
    {
      metric: "Overall Lead → Close",
      yourValue: overallLeadToClose,
      benchmark: benchmarks.overallLeadToClose,
      format: "percent",
      higherIsBetter: true,
      tooltip: "End-to-end conversion rate from lead to closed deal",
    },
    {
      metric: "LTV:CAC Ratio",
      yourValue: outputs.ltvCacRatio ?? 0,
      benchmark: benchmarks.targetLtvCacRatio,
      format: "ratio",
      higherIsBetter: true,
      tooltip: "Lifetime value to customer acquisition cost ratio",
    },
    {
      metric: "CAC Payback",
      yourValue: outputs.cacPaybackMonths ?? 0,
      benchmark: benchmarks.targetCacPayback,
      format: "months",
      higherIsBetter: false,
      tooltip: "Months to recover customer acquisition cost",
    },
  ];

  const formatValue = (value: number, format: ComparisonRow["format"]) => {
    const safeValue = value ?? 0;
    switch (format) {
      case "percent":
        return `${safeValue.toFixed(1)}%`;
      case "ratio":
        return `${safeValue.toFixed(1)}x`;
      case "months":
        return `${safeValue.toFixed(1)} mo`;
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(safeValue);
      default:
        return safeValue.toString();
    }
  };

  const getComparison = (row: ComparisonRow) => {
    const diff = row.yourValue - row.benchmark;
    const percentDiff =
      row.benchmark !== 0 ? ((diff / row.benchmark) * 100).toFixed(0) : "N/A";

    const isPositive = row.higherIsBetter ? diff > 0 : diff < 0;
    const isNeutral = Math.abs(diff) < row.benchmark * 0.05;

    if (isNeutral) {
      return {
        icon: <Minus className="h-4 w-4" />,
        color: "text-muted-foreground",
        badge: "secondary" as const,
        text: "On Target",
      };
    }

    if (isPositive) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-success",
        badge: "default" as const,
        text: `+${percentDiff}%`,
      };
    }

    return {
      icon: <TrendingDown className="h-4 w-4" />,
      color: "text-destructive",
      badge: "destructive" as const,
      text: `${percentDiff}%`,
    };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Benchmark Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              <TableHead className="text-right">Your Model</TableHead>
              <TableHead className="text-right">Benchmark</TableHead>
              <TableHead className="text-right">Variance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comparisons.map((row) => {
              const comparison = getComparison(row);
              return (
                <TableRow key={row.metric}>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-help">
                            <span className="font-medium">{row.metric}</span>
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{row.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatValue(row.yourValue, row.format)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {formatValue(row.benchmark, row.format)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={comparison.badge}
                      className="gap-1 font-mono"
                    >
                      {comparison.icon}
                      {comparison.text}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">Benchmarks</span> are based on B2B SaaS metrics. LTV:CAC ≥3:1 and CAC payback ≤12 months indicate healthy unit economics.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}