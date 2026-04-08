import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerOutputs, PlannerConfig } from "@/hooks/useROIPlanner";
import { FileText, Target, CheckCircle2, TrendingUp, DollarSign, Gauge } from "lucide-react";

interface ExecutiveSummaryPanelProps {
  outputs: PlannerOutputs;
  config: PlannerConfig;
  mode: "goal-led" | "budget-led";
  targetARR: number;
  yearlyBudget: number;
}

export function ExecutiveSummaryPanel({
  outputs,
  config,
  mode,
  targetARR,
  yearlyBudget,
}: ExecutiveSummaryPanelProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));

  const pipelineToARR = outputs.newARR > 0 ? outputs.yearlyPipeline / outputs.newARR : 0;
  const pipelineHealthy = pipelineToARR >= 3;

  // Generate concise talk track based on mode
  const generateTalkTrack = () => {
    if (mode === "goal-led") {
      return `To achieve ${formatCurrency(targetARR)} in ARR, invest ${formatCurrency(outputs.totalSpend)} to generate ${formatNumber(outputs.totalLeads)} leads → ${formatNumber(outputs.totalDeals)} deals. LTV:CAC is ${outputs.ltvCacRatio.toFixed(1)}:1 with ${outputs.cacPaybackMonths.toFixed(0)}-month payback. Pipeline coverage: ${pipelineToARR.toFixed(1)}x${pipelineHealthy ? " ✓" : " (below 3x target)"}.`;
    } else {
      return `With ${formatCurrency(yearlyBudget)} budget, project ${formatCurrency(outputs.newARR)} ARR from ${formatNumber(outputs.totalLeads)} leads → ${formatNumber(outputs.totalDeals)} deals. LTV:CAC is ${outputs.ltvCacRatio.toFixed(1)}:1, CAC ${formatCurrency(outputs.cac)}. Pipeline: ${formatCurrency(outputs.yearlyPipeline)} (${pipelineToARR.toFixed(1)}x coverage${pipelineHealthy ? "" : " - needs attention"}).`;
    }
  };

  // Generate simplified OKRs
  const okrs = [
    {
      icon: <DollarSign className="h-4 w-4 text-chart-1" />,
      label: "Revenue",
      value: `${formatCurrency(mode === "goal-led" ? targetARR : outputs.newARR)} via ${formatNumber(outputs.totalDeals)} deals`,
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-chart-2" />,
      label: "Pipeline",
      value: `${formatCurrency(outputs.yearlyPipeline)} from ${formatNumber(outputs.totalLeads)} leads`,
    },
    {
      icon: <Gauge className="h-4 w-4 text-chart-3" />,
      label: "Efficiency",
      value: `${formatCurrency(outputs.cac)} CAC, ${outputs.ltvCacRatio.toFixed(1)}:1 LTV:CAC`,
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        Executive Summary
      </h3>
      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="okrs">OKRs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="mt-0">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {generateTalkTrack()}
              </p>
            </TabsContent>
            
            <TabsContent value="okrs" className="mt-0 space-y-3">
              {okrs.map((okr, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {okr.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{okr.label}</div>
                    <div className="text-xs text-muted-foreground">{okr.value}</div>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}