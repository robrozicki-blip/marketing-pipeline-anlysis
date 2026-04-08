import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetData, calculateMetrics, formatCurrency } from "@/lib/budgetCalculations";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface BudgetVsActualProps {
  budgetData: BudgetData;
}

export function BudgetVsActual({ budgetData }: BudgetVsActualProps) {
  const metrics = calculateMetrics(budgetData);
  
  // Calculate actual spend from monthly data
  const actualSpend = budgetData.monthlySpend?.reduce((total, month) => {
    return total + month.demandGen + month.content + month.field + 
           month.brand + month.ecosystem + month.martech + month.headcount;
  }, 0) || 0;

  const plannedBudget = metrics.marketingBudget;
  const variance = actualSpend - plannedBudget;
  const variancePercent = plannedBudget > 0 ? (variance / plannedBudget) * 100 : 0;
  const isOverBudget = variance > 0;

  // Calculate category-wise variance
  const categories = [
    { name: "Demand Gen", planned: metrics.budgetBreakdown.demandGen, actual: 0 },
    { name: "Content", planned: metrics.budgetBreakdown.content, actual: 0 },
    { name: "Field", planned: metrics.budgetBreakdown.field, actual: 0 },
    { name: "Brand", planned: metrics.budgetBreakdown.brand, actual: 0 },
    { name: "Ecosystem", planned: metrics.budgetBreakdown.ecosystem, actual: 0 },
    { name: "MarTech", planned: metrics.budgetBreakdown.martech, actual: 0 },
    { name: "Headcount", planned: metrics.budgetBreakdown.headcount, actual: 0 },
  ];

  if (budgetData.monthlySpend) {
    budgetData.monthlySpend.forEach(month => {
      categories[0].actual += month.demandGen;
      categories[1].actual += month.content;
      categories[2].actual += month.field;
      categories[3].actual += month.brand;
      categories[4].actual += month.ecosystem;
      categories[5].actual += month.martech;
      categories[6].actual += month.headcount;
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual</CardTitle>
          <CardDescription>Comparison of planned budget and actual spend</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Planned Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(plannedBudget)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Actual Spend</p>
              <p className="text-2xl font-bold">{formatCurrency(actualSpend)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Variance</p>
              <div className="flex items-center gap-2">
                <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                  {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                </p>
                {isOverBudget ? (
                  <TrendingUp className="h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-green-500" />
                )}
              </div>
              <p className={`text-sm ${isOverBudget ? 'text-red-500' : 'text-green-500'}`}>
                {variance >= 0 ? '+' : ''}{variancePercent.toFixed(1)}%
              </p>
            </div>
          </div>

          {Math.abs(variancePercent) > 10 && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-600">Budget Alert</p>
                <p className="text-sm text-muted-foreground">
                  {isOverBudget 
                    ? `Spending is ${Math.abs(variancePercent).toFixed(1)}% over budget`
                    : `Spending is ${Math.abs(variancePercent).toFixed(1)}% under budget`
                  }
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <h4 className="font-semibold text-sm">Category Breakdown</h4>
            {categories.map(category => {
              const catVariance = category.actual - category.planned;
              const catVariancePercent = category.planned > 0 ? (catVariance / category.planned) * 100 : 0;
              const isCatOver = catVariance > 0;
              
              return (
                <div key={category.name} className="flex items-center justify-between p-2 rounded border">
                  <span className="text-sm font-medium">{category.name}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">{formatCurrency(category.planned)}</span>
                    <span className="font-medium">{formatCurrency(category.actual)}</span>
                    <span className={`w-20 text-right ${isCatOver ? 'text-red-500' : 'text-green-500'}`}>
                      {catVariance >= 0 ? '+' : ''}{catVariancePercent.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
