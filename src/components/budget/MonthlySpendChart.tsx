import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlySpend } from "@/lib/budgetCalculations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/budgetCalculations";

interface MonthlySpendChartProps {
  data: MonthlySpend[];
}

export function MonthlySpendChart({ data }: MonthlySpendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Spend by Channel</CardTitle>
          <CardDescription>No monthly data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Upload budget data to see monthly spend trends
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    total: item.demandGen + item.content + item.field + 
           item.brand + item.ecosystem + item.martech + item.headcount
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spend by Channel</CardTitle>
        <CardDescription>Budget allocation across channels over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
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
            <Bar dataKey="demandGen" stackId="a" fill="hsl(var(--chart-1))" name="Demand Gen" />
            <Bar dataKey="content" stackId="a" fill="hsl(var(--chart-2))" name="Content" />
            <Bar dataKey="field" stackId="a" fill="hsl(var(--chart-3))" name="Field" />
            <Bar dataKey="brand" stackId="a" fill="hsl(var(--chart-4))" name="Brand" />
            <Bar dataKey="ecosystem" stackId="a" fill="hsl(var(--chart-5))" name="Ecosystem" />
            <Bar dataKey="martech" stackId="a" fill="hsl(var(--muted-foreground))" name="MarTech" />
            <Bar dataKey="headcount" stackId="a" fill="hsl(280 60% 60%)" name="Headcount" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
