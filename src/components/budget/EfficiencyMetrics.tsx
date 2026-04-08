import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalculatedMetrics, formatCurrency } from "@/lib/budgetCalculations";
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";

interface EfficiencyMetricsProps {
  metrics: CalculatedMetrics;
}

export function EfficiencyMetrics({ metrics }: EfficiencyMetricsProps) {
  // Helper function to safely format values and handle edge cases
  const safeValue = (value: number) => {
    if (!isFinite(value) || isNaN(value)) return 0;
    return value;
  };

  const efficiencyMetrics = [
    {
      title: "CAC Ratio",
      value: safeValue(metrics.cacRatio).toFixed(2),
      benchmark: "0.7 - 1.2",
      description: "New ARR × Gross Margin ÷ Total CAC",
      status: safeValue(metrics.cacRatio) >= 0.7 && safeValue(metrics.cacRatio) <= 1.2 ? "good" : "warning",
      progress: Math.min(Math.max((safeValue(metrics.cacRatio) / 1.2) * 100, 0), 100),
    },
    {
      title: "Payback Period",
      value: `${safeValue(metrics.paybackPeriod).toFixed(0)} months`,
      benchmark: "12-18 months",
      description: "Time to recover customer acquisition cost",
      status: safeValue(metrics.paybackPeriod) <= 18 ? "good" : "warning",
      progress: Math.min(Math.max(100 - ((safeValue(metrics.paybackPeriod) - 12) / 6) * 100, 0), 100),
    },
    {
      title: "LTV:CAC Ratio",
      value: `${safeValue(metrics.ltvCacRatio).toFixed(1)}:1`,
      benchmark: "3:1",
      description: "Lifetime value vs customer acquisition cost",
      status: safeValue(metrics.ltvCacRatio) >= 3 ? "good" : "warning",
      progress: Math.min(Math.max((safeValue(metrics.ltvCacRatio) / 5) * 100, 0), 100),
    },
    {
      title: "Marketing % of New ARR",
      value: `${(safeValue(metrics.marketingBudgetToNewARR) * 100).toFixed(0)}%`,
      benchmark: "30-55%",
      description: "Marketing budget as % of new ARR",
      status: safeValue(metrics.marketingBudgetToNewARR) >= 0.30 && safeValue(metrics.marketingBudgetToNewARR) <= 0.55 ? "good" : "warning",
      progress: Math.min(Math.max((safeValue(metrics.marketingBudgetToNewARR) / 0.55) * 100, 0), 100),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Efficiency Metrics</CardTitle>
        <CardDescription>
          Key performance indicators vs industry benchmarks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {efficiencyMetrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">{metric.title}</h4>
                    {metric.status === "good" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">{metric.value}</div>
                  <div className="text-xs text-muted-foreground">Target: {metric.benchmark}</div>
                </div>
              </div>
              <Progress 
                value={metric.progress} 
                className="h-2"
              />
            </div>
          ))}
          
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h5 className="text-sm font-semibold text-foreground mb-1">Budget Summary</h5>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Total CAC: <span className="font-semibold text-foreground">{formatCurrency(metrics.totalCAC)}</span></p>
                  <p>Marketing: <span className="font-semibold text-foreground">{formatCurrency(metrics.marketingBudget)}</span></p>
                  <p>Sales: <span className="font-semibold text-foreground">{formatCurrency(metrics.salesBudget)}</span></p>
                  <p>CAC per Customer: <span className="font-semibold text-foreground">{formatCurrency(metrics.cacPerCustomer)}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
