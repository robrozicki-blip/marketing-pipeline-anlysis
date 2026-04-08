import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { BudgetData, CalculatedMetrics, calculateMetrics, formatCurrency, formatPercentage } from "@/lib/budgetCalculations";
import { TrendingUp, TrendingDown, Minus, Lightbulb, Rocket } from "lucide-react";

interface ScenarioBuilderProps {
  budgetData: BudgetData;
  currentMetrics: CalculatedMetrics;
  budgetAdjustment: number;
  setBudgetAdjustment: (value: number) => void;
  onBudgetDataChange: (data: BudgetData) => void;
}

export function ScenarioBuilder({ budgetData, currentMetrics, budgetAdjustment, setBudgetAdjustment, onBudgetDataChange }: ScenarioBuilderProps) {
  const presetScenarios = [
    { name: "Lights On", value: -80, icon: Lightbulb, description: "20% of current budget" },
    { name: "Market Leader", value: 40, icon: TrendingUp, description: "40% increase" },
    { name: "World Domination", value: 100, icon: Rocket, description: "100% increase" },
  ];

  // Calculate scenario metrics with adjusted budget
  // Key insight: Assume CAC efficiency stays constant, so we can acquire proportionally more/fewer customers
  const adjustedBudget = budgetData.totalBudget * (1 + budgetAdjustment / 100);
  
  // Calculate how many customers we can acquire with the new budget (keeping same CAC per customer)
  const budgetMultiplier = adjustedBudget / budgetData.totalBudget;
  const adjustedNewARR = budgetData.newARR * budgetMultiplier;
  
  // Helper function to proportionally adjust budget values
  const adjustBudgetValue = (value: number | string): number | string => {
    if (typeof value === 'string' && value.trim().endsWith('%')) {
      // If it's a percentage, keep it as a percentage (it will scale automatically)
      return value;
    }
    // If it's an absolute number, scale it proportionally
    const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    return numValue * budgetMultiplier;
  };
  
  const scenarioData: BudgetData = {
    ...budgetData,
    totalBudget: adjustedBudget,
    newARR: adjustedNewARR, // More/less budget = more/less customers = more/less revenue
    // Proportionally adjust all budget category allocations
    demandGen: adjustBudgetValue(budgetData.demandGen),
    content: adjustBudgetValue(budgetData.content),
    field: adjustBudgetValue(budgetData.field),
    brand: adjustBudgetValue(budgetData.brand),
    ecosystem: adjustBudgetValue(budgetData.ecosystem),
    martech: adjustBudgetValue(budgetData.martech),
    headcount: adjustBudgetValue(budgetData.headcount),
  };
  const scenarioMetrics = calculateMetrics(scenarioData);

  // Calculate differences
  const getDifference = (current: number, scenario: number) => {
    const diff = scenario - current;
    const percentDiff = current !== 0 ? (diff / current) * 100 : 0;
    return { diff, percentDiff };
  };

  const metrics = [
    {
      label: "New ARR",
      current: currentMetrics.newARR,
      scenario: scenarioMetrics.newARR,
      format: formatCurrency,
    },
    {
      label: "New Customers",
      current: currentMetrics.totalNewCustomers,
      scenario: scenarioMetrics.totalNewCustomers,
      format: (v: number) => Math.round(v).toLocaleString(),
    },
    {
      label: "Marketing Budget",
      current: currentMetrics.marketingBudget,
      scenario: scenarioMetrics.marketingBudget,
      format: formatCurrency,
    },
    {
      label: "CAC per Customer",
      current: currentMetrics.cacPerCustomer,
      scenario: scenarioMetrics.cacPerCustomer,
      format: formatCurrency,
    },
    {
      label: "CAC Ratio",
      current: currentMetrics.cacRatio,
      scenario: scenarioMetrics.cacRatio,
      format: (v: number) => v.toFixed(2),
    },
    {
      label: "Payback Period",
      current: currentMetrics.paybackPeriod,
      scenario: scenarioMetrics.paybackPeriod,
      format: (v: number) => `${v.toFixed(1)} months`,
    },
    {
      label: "LTV:CAC Ratio",
      current: currentMetrics.ltvCacRatio,
      scenario: scenarioMetrics.ltvCacRatio,
      format: (v: number) => `${v.toFixed(2)}:1`,
    },
  ];

  const getTrendIcon = (percentDiff: number) => {
    if (Math.abs(percentDiff) < 0.1) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (percentDiff > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-xs font-medium">Quick Scenarios</span>
            <div className="grid grid-cols-3 gap-1.5">
              {presetScenarios.map((scenario) => {
                const Icon = scenario.icon;
                const isActive = budgetAdjustment === scenario.value;
                return (
                  <Button
                    key={scenario.name}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setBudgetAdjustment(scenario.value)}
                    className="flex flex-col h-auto py-2 gap-0.5 text-[11px]"
                    size="sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-semibold leading-tight">{scenario.name}</span>
                    <span className="text-[10px] opacity-80 leading-tight">{scenario.description}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-xs font-medium">Custom Adjustment</span>
            <span className="text-lg font-bold">
              {budgetAdjustment > 0 ? "+" : ""}{budgetAdjustment}%
            </span>
          </div>
          <Slider
            value={[budgetAdjustment]}
            onValueChange={(value) => setBudgetAdjustment(value[0])}
            min={-50}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex text-[10px] text-muted-foreground relative">
            <span className="absolute left-0">-50%</span>
            <span className="absolute left-1/3">0%</span>
            <span className="absolute right-0">+100%</span>
          </div>
        </div>

        <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-xs font-semibold leading-tight">Marketing Contribution to New ARR</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                What % of new ARR is sourced by Marketing
              </span>
            </div>
            <span className="text-base font-bold text-primary shrink-0">
              {(budgetData.marketingPipelinePercentage * 100).toFixed(0)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[budgetData.marketingPipelinePercentage * 100]}
            onValueChange={(value) => onBudgetDataChange({
              ...budgetData,
              marketingPipelinePercentage: value[0] / 100
            })}
            className="py-1"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-2">
          {metrics.map((metric) => {
            const { diff, percentDiff } = getDifference(metric.current, metric.scenario);
            return (
              <div key={metric.label} className="border rounded-lg p-2 space-y-1.5 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{metric.label}</span>
                  {getTrendIcon(percentDiff)}
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Current</div>
                    <div className="text-xs">{metric.format(metric.current)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Scenario</div>
                    <div className="text-xs font-semibold">{metric.format(metric.scenario)}</div>
                  </div>
                </div>
                {Math.abs(percentDiff) >= 0.1 && (
                  <div className="text-[10px] text-muted-foreground">
                    {percentDiff > 0 ? "+" : ""}{percentDiff.toFixed(1)}% change
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
