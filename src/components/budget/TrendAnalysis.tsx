import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetData, formatCurrency } from "@/lib/budgetCalculations";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface TrendAnalysisProps {
  budgetData: BudgetData;
}

export function TrendAnalysis({ budgetData }: TrendAnalysisProps) {
  if (!budgetData.monthlySpend || budgetData.monthlySpend.length === 0) {
    return null;
  }

  // Calculate month-over-month trends
  const trendData = budgetData.monthlySpend.map((month, index) => {
    const total = month.demandGen + month.content + month.field + 
                 month.brand + month.ecosystem + month.martech + month.headcount;
    
    const prevTotal = index > 0 
      ? budgetData.monthlySpend![index - 1].demandGen + 
        budgetData.monthlySpend![index - 1].content + 
        budgetData.monthlySpend![index - 1].field +
        budgetData.monthlySpend![index - 1].brand +
        budgetData.monthlySpend![index - 1].ecosystem +
        budgetData.monthlySpend![index - 1].martech +
        budgetData.monthlySpend![index - 1].headcount
      : total;

    const growth = index > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;

    return {
      month: month.month,
      total,
      growth: growth.toFixed(1),
    };
  });

  // Calculate insights
  const avgSpend = trendData.reduce((sum, d) => sum + d.total, 0) / trendData.length;
  const maxSpend = Math.max(...trendData.map(d => d.total));
  const minSpend = Math.min(...trendData.map(d => d.total));
  const totalSpend = trendData.reduce((sum, d) => sum + d.total, 0);
  
  // Find biggest increases/decreases
  const growthRates = trendData.slice(1).map(d => parseFloat(d.growth));
  const maxGrowth = Math.max(...growthRates);
  const minGrowth = Math.min(...growthRates);
  
  // Detect anomalies (spending more than 20% above average)
  const anomalies = trendData.filter(d => d.total > avgSpend * 1.2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>Month-over-month spending patterns and insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Total Spend"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Average Monthly</p>
            <p className="text-2xl font-bold">{formatCurrency(avgSpend)}</p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Highest Month</p>
            <p className="text-2xl font-bold">{formatCurrency(maxSpend)}</p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total Spend</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold">Key Insights</h4>
          
          <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-600">Highest Growth</p>
              <p className="text-sm text-muted-foreground">
                Peak month-over-month growth: {maxGrowth > 0 ? '+' : ''}{maxGrowth.toFixed(1)}%
              </p>
            </div>
          </div>

          {minGrowth < -10 && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <TrendingDown className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600">Significant Decrease</p>
                <p className="text-sm text-muted-foreground">
                  Largest drop: {minGrowth.toFixed(1)}% month-over-month
                </p>
              </div>
            </div>
          )}

          {anomalies.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-600">Spending Anomalies</p>
                <p className="text-sm text-muted-foreground">
                  {anomalies.length} month{anomalies.length !== 1 ? 's' : ''} with spending 
                  20%+ above average: {anomalies.map(a => a.month).join(', ')}
                </p>
              </div>
            </div>
          )}

          {maxSpend / minSpend > 1.5 && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-600">High Variability</p>
                <p className="text-sm text-muted-foreground">
                  Spending varies significantly month-to-month. Consider more consistent 
                  budget allocation for better forecasting.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
