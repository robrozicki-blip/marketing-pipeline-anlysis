import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatedMetrics, formatCurrency, formatPercentage } from "@/lib/budgetCalculations";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface ROICalculatorProps {
  metrics: CalculatedMetrics;
}

export function ROICalculator({ metrics }: ROICalculatorProps) {
  const channels = [
    { name: "Demand Gen", spend: metrics.budgetBreakdown.demandGen, percentage: metrics.budgetPercentages.demandGen },
    { name: "Content", spend: metrics.budgetBreakdown.content, percentage: metrics.budgetPercentages.content },
    { name: "Field", spend: metrics.budgetBreakdown.field, percentage: metrics.budgetPercentages.field },
    { name: "Brand", spend: metrics.budgetBreakdown.brand, percentage: metrics.budgetPercentages.brand },
    { name: "Ecosystem", spend: metrics.budgetBreakdown.ecosystem, percentage: metrics.budgetPercentages.ecosystem },
    { name: "MarTech", spend: metrics.budgetBreakdown.martech, percentage: metrics.budgetPercentages.martech },
  ];

  // Calculate total marketing budget (excluding headcount for channel analysis)
  const totalMarketingSpend = channels.reduce((sum, c) => sum + c.spend, 0);

  // Calculate actual closed revenue that marketing generates
  // Marketing generates X% of pipeline, which closes to become actual ARR
  const marketingPercentage = metrics.pipelineNeeded > 0 
    ? metrics.marketingPipelineNeeded / metrics.pipelineNeeded 
    : 0;
  const marketingAttributedARR = metrics.newARR * marketingPercentage;

  const channelData = channels.map(channel => {
    // Channel's contribution is based on its % of total marketing spend
    // Applied to the actual closed ARR that marketing generates
    const channelContributionPct = totalMarketingSpend > 0 ? channel.spend / totalMarketingSpend : 0;
    const revenueContribution = marketingAttributedARR * channelContributionPct;
    
    // ROI = (Revenue - Cost) / Cost
    const roi = channel.spend > 0 ? ((revenueContribution - channel.spend) / channel.spend) * 100 : 0;
    
    // Efficiency = Revenue / Cost (revenue multiplier)
    const efficiency = channel.spend > 0 ? revenueContribution / channel.spend : 0;

    return {
      name: channel.name,
      spend: channel.spend,
      revenue: revenueContribution,
      roi: roi,
      efficiency: efficiency,
    };
  }).filter(c => c.spend > 0); // Only show channels with spend

  // Sort by ROI descending
  const sortedByROI = [...channelData].sort((a, b) => b.roi - a.roi);
  
  // Find best and worst performing
  const bestPerformer = sortedByROI[0];
  const worstPerformer = sortedByROI[sortedByROI.length - 1];

  // Calculate overall marketing efficiency based on actual closed ARR
  const totalSpend = channelData.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = marketingAttributedARR; // Total marketing-attributed closed ARR
  const overallROI = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
  const avgEfficiency = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  const getROIColor = (roi: number) => {
    if (roi >= 200) return "hsl(var(--chart-1))"; // Green
    if (roi >= 100) return "hsl(var(--chart-2))"; // Yellow
    return "hsl(var(--chart-5))"; // Red
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel ROI Analysis</CardTitle>
        <CardDescription>Return on investment by marketing channel</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Marketing ROI</p>
            <p className="text-2xl font-bold">{overallROI.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totalRevenue)} revenue from {formatCurrency(totalSpend)} spend
            </p>
          </div>
          <div className="space-y-1 p-3 border rounded-lg">
            <p className="text-sm text-muted-foreground">Avg Efficiency</p>
            <p className="text-2xl font-bold">
              {avgEfficiency.toFixed(2)}x
            </p>
            <p className="text-xs text-muted-foreground">
              Revenue multiplier per dollar spent
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sortedByROI}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === "ROI") return `${value.toFixed(0)}%`;
                return formatCurrency(value as number);
              }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar dataKey="roi" name="ROI %">
              {sortedByROI.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getROIColor(entry.roi)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="space-y-3">
          <h4 className="font-semibold">Channel Performance</h4>
          
          {bestPerformer && (
            <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-green-600">Best Performer: {bestPerformer.name}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Spend</p>
                    <p className="font-medium">{formatCurrency(bestPerformer.spend)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">{formatCurrency(bestPerformer.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-medium">{bestPerformer.roi.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {worstPerformer && worstPerformer.roi < 100 && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium text-amber-600">Needs Attention: {worstPerformer.name}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Spend</p>
                    <p className="font-medium">{formatCurrency(worstPerformer.spend)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Revenue</p>
                    <p className="font-medium">{formatCurrency(worstPerformer.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ROI</p>
                    <p className="font-medium">{worstPerformer.roi.toFixed(0)}%</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Consider reallocating budget to higher-performing channels
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">All Channels</h4>
          {sortedByROI.map((channel) => (
            <div key={channel.name} className="flex items-center justify-between p-2 rounded border">
              <span className="text-sm font-medium">{channel.name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">{formatCurrency(channel.spend)}</span>
                <span className="font-medium">{channel.efficiency.toFixed(2)}x</span>
                <span className={`w-16 text-right font-semibold ${
                  channel.roi >= 200 ? 'text-green-600' : 
                  channel.roi >= 100 ? 'text-amber-600' : 
                  'text-red-600'
                }`}>
                  {channel.roi.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
