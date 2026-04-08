import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatedMetrics, formatCurrency, formatNumber } from "@/lib/budgetCalculations";
import { ArrowDown } from "lucide-react";

interface SalesFunnelProps {
  metrics: CalculatedMetrics;
}

export function SalesFunnel({ metrics }: SalesFunnelProps) {
  // Calculate marketing's portion of the funnel
  const marketingRatio = metrics.marketingPipelineNeeded / metrics.pipelineNeeded;
  
  const funnelStages = [
    {
      name: "Leads",
      value: Math.round(metrics.leadsNeeded * marketingRatio),
      color: "bg-chart-1",
    },
    {
      name: "MQLs",
      value: Math.round(metrics.mqlsNeeded * marketingRatio),
      color: "bg-chart-2",
    },
    {
      name: "SQLs (Opportunities)",
      value: Math.round(metrics.sqlsNeeded * marketingRatio),
      color: "bg-chart-3",
    },
    {
      name: "Closed/Won",
      value: Math.round(metrics.totalNewCustomers * marketingRatio),
      color: "bg-success",
    },
  ];

  const maxValue = funnelStages[0].value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketing Funnel</CardTitle>
        <CardDescription>
          Volume needed at each stage to hit {formatCurrency(metrics.marketingPipelineNeeded)} marketing pipeline goal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelStages.map((stage, index) => {
          const widthPercentage = (stage.value / maxValue) * 100;
          
          return (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.name}</span>
                <span className="text-muted-foreground">{formatNumber(stage.value)}</span>
              </div>
              
              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`h-full ${stage.color} flex items-center justify-center text-background font-semibold transition-all duration-500`}
                  style={{ width: `${widthPercentage}%` }}
                >
                  {widthPercentage > 15 && formatNumber(stage.value)}
                </div>
              </div>
              
              {index < funnelStages.length - 1 && (
                <div className="flex justify-center">
                  <ArrowDown className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
        
        <div className="pt-4 mt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Marketing Pipeline Target</span>
            <span className="font-semibold text-primary">{formatCurrency(metrics.marketingPipelineNeeded)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
