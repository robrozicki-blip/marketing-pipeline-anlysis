import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Zap } from "lucide-react";
import { BudgetData, CalculatedMetrics, formatCurrency, formatNumber } from "@/lib/budgetCalculations";

interface MetricsOverviewProps {
  metrics: CalculatedMetrics;
  currentMetrics: CalculatedMetrics;
  budgetData: BudgetData;
  historicalData: {
    lastYear: {
      newARR: number;
      totalARR: number;
      marketingBudget: number;
      totalCAC: number;
    };
  };
}

const formatCompact = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
};

export function MetricsOverview({ metrics, currentMetrics, budgetData, historicalData }: MetricsOverviewProps) {
  const arrGrowth = currentMetrics.previousARR > 0
    ? ((currentMetrics.totalARR - currentMetrics.previousARR) / currentMetrics.previousARR) * 100
    : 0;
  const budgetChange = metrics.marketingBudget - historicalData.lastYear.marketingBudget;
  const budgetGrowth = (budgetChange / historicalData.lastYear.marketingBudget) * 100;

  // Calculate cost per funnel stage based on actual funnel efficiency
  // Cost per lead is the baseline cost from demand gen activities
  // As conversion rates improve, the same budget generates the same leads but converts better
  const demandGenBudget = metrics.budgetBreakdown.demandGen + metrics.budgetBreakdown.content;
  
  // Estimate leads generated (not needed) based on industry benchmarks
  // Typical B2B SaaS: $50-200 per lead depending on segment
  const estimatedLeadCost = 100; // Baseline cost per lead
  const leadsGenerated = demandGenBudget / estimatedLeadCost;
  
  // Calculate actual costs based on what's generated vs what converts
  const costPerLead = demandGenBudget / leadsGenerated;
  const costPerMQL = costPerLead / budgetData.leadToMQLRate;
  const costPerSQL = costPerMQL / budgetData.mqlToSQLRate;

  // Calculate marketing contribution
  const marketingGeneratedCustomers = Math.round(metrics.totalNewCustomers * metrics.marketingPipelineNeeded / metrics.pipelineNeeded);
  const marketingGeneratedARR = metrics.newARR * metrics.marketingPipelineNeeded / metrics.pipelineNeeded;
  
  // Calculate marketing ROI and efficiency
  const marketingROI = metrics.marketingBudget > 0 
    ? ((marketingGeneratedARR - metrics.marketingBudget) / metrics.marketingBudget) * 100 
    : 0;
  const avgEfficiency = metrics.marketingBudget > 0 
    ? marketingGeneratedARR / metrics.marketingBudget 
    : 0;

  const metricCards = [
    {
      title: "2026 Bookings Goal",
      value: formatCurrency(currentMetrics.totalARR),
      change: arrGrowth,
      icon: DollarSign,
      trend: arrGrowth > 0 ? "up" : "down",
      breakdown: [
        { label: "New", value: currentMetrics.newARR },
        { label: "Expansion", value: currentMetrics.expansionRevenue },
        { label: "Partner", value: currentMetrics.partnerARR },
      ],
    },
    {
      title: "Marketing Budget",
      value: formatCurrency(metrics.marketingBudget),
      subtitle: `${((metrics.marketingBudget / currentMetrics.totalARR) * 100).toFixed(1)}% of Total ARR | Benchmark: 30%-55%`,
      icon: DollarSign,
    },
    {
      title: "Pipeline Needed",
      value: formatCurrency(metrics.marketingPipelineNeeded),
      subtitle: `${formatCurrency(metrics.pipelineNeeded)} Total Pipeline`,
      quarters: [
        { label: "Q1", value: metrics.marketingPipelineNeeded / 4 },
        { label: "Q2", value: metrics.marketingPipelineNeeded / 4 },
        { label: "Q3", value: metrics.marketingPipelineNeeded / 4 },
        { label: "Q4", value: metrics.marketingPipelineNeeded / 4 },
      ],
      icon: Target,
    },
    {
      title: "New Customers",
      value: formatNumber(marketingGeneratedCustomers),
      subtitle: `${formatCurrency(marketingGeneratedARR)} ARR | ${formatCurrency(metrics.cacPerCustomer)} CAC`,
      showCostMetrics: true,
      icon: Users,
    },
    {
      title: "LTV:CAC Ratio",
      value: `${metrics.ltvCacRatio.toFixed(1)}:1`,
      subtitle: "Target: 3.5:1",
      icon: Zap,
      trend: metrics.ltvCacRatio >= 3.5 ? "up" : "neutral",
    },
    {
      title: "Marketing ROI",
      value: `${marketingROI.toFixed(0)}%`,
      subtitle: `${formatCurrency(marketingGeneratedARR)} revenue from ${formatCurrency(metrics.marketingBudget)}`,
      icon: TrendingUp,
      trend: marketingROI > 100 ? "up" : "neutral",
    },
    {
      title: "Avg Efficiency",
      value: `${avgEfficiency.toFixed(2)}x`,
      subtitle: "Revenue multiplier per dollar",
      icon: Zap,
      trend: avgEfficiency > 2 ? "up" : "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5">
      {metricCards.map((metric, index) => (
        <Card 
          key={index} 
          className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card/50 backdrop-blur"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {metric.title}
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-2">
              <metric.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-foreground tracking-tight">
                {metric.value}
              </div>
              {metric.trend && (
                <div className={`flex items-center gap-1 ${
                  metric.trend === "up" ? "text-success" : 
                  metric.trend === "down" ? "text-destructive" : 
                  "text-muted-foreground"
                }`}>
                  {metric.trend === "up" && <TrendingUp className="h-4 w-4" />}
                  {metric.trend === "down" && <TrendingDown className="h-4 w-4" />}
                </div>
              )}
            </div>
            
            {metric.change !== undefined && (
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                metric.trend === "up" 
                  ? "bg-success/10 text-success" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {metric.trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {Math.abs(metric.change).toFixed(1)}% vs last year
                </span>
              </div>
            )}
            
            {metric.subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                {metric.subtitle}
              </p>
            )}
            
            {metric.breakdown && (
              <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-border/50">
                {metric.breakdown.map((item) => (
                  <div key={item.label} className="text-center space-y-0.5">
                    <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                    <p className="text-[10px] font-semibold text-foreground">{formatCompact(item.value)}</p>
                  </div>
                ))}
              </div>
            )}
            
            {metric.quarters && (
              <div className="grid grid-cols-4 gap-1 pt-3 mt-3 border-t border-border/50">
                {metric.quarters.map((quarter) => (
                  <div key={quarter.label} className="text-center space-y-0.5">
                    <p className="text-[8px] text-muted-foreground font-medium">{quarter.label}</p>
                    <p className="text-[10px] font-semibold text-foreground">{formatCompact(quarter.value)}</p>
                  </div>
                ))}
              </div>
            )}
            
            {metric.showCostMetrics && (
              <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-border/50">
                <div className="text-center space-y-0.5">
                  <p className="text-[8px] text-muted-foreground font-medium">Cost/Lead</p>
                  <p className="text-[10px] font-semibold text-foreground">{formatCompact(costPerLead)}</p>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[8px] text-muted-foreground font-medium">Cost/MQL</p>
                  <p className="text-[10px] font-semibold text-foreground">{formatCompact(costPerMQL)}</p>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-[8px] text-muted-foreground font-medium">Cost/SQL</p>
                  <p className="text-[10px] font-semibold text-foreground">{formatCompact(costPerSQL)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
