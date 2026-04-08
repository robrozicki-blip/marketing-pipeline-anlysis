import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BudgetData, CalculatedMetrics, formatCurrency } from "@/lib/budgetCalculations";

interface BudgetAllocationProps {
  budgetData: BudgetData;
  metrics: CalculatedMetrics;
}

export function BudgetAllocation({ metrics }: BudgetAllocationProps) {
  const allBudgetData = [
    { name: "Demand Gen", value: metrics.budgetBreakdown.demandGen, color: "hsl(var(--chart-1))" },
    { name: "Content", value: metrics.budgetBreakdown.content, color: "hsl(var(--chart-2))" },
    { name: "Field", value: metrics.budgetBreakdown.field, color: "hsl(var(--chart-3))" },
    { name: "Brand", value: metrics.budgetBreakdown.brand, color: "hsl(var(--chart-4))" },
    { name: "Ecosystem", value: metrics.budgetBreakdown.ecosystem, color: "hsl(var(--chart-5))" },
    { name: "MarTech", value: metrics.budgetBreakdown.martech, color: "hsl(220 10% 60%)" },
    { name: "Headcount", value: metrics.budgetBreakdown.headcount, color: "hsl(280 60% 60%)" },
  ];

  // Only show categories with values > 0
  const budgetData = allBudgetData.filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{payload[0].name}</p>
          <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">
            {((payload[0].value / metrics.marketingBudget) * 100).toFixed(1)}% of budget
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Allocation</CardTitle>
        <CardDescription>
          Marketing budget breakdown by category • Total: {formatCurrency(metrics.marketingBudget)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3">
            {budgetData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-foreground">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {((item.value / metrics.marketingBudget) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
