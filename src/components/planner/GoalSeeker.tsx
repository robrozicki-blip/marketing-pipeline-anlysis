import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Crosshair, Calculator, ArrowRight } from "lucide-react";
import { PlannerConfig } from "@/hooks/useROIPlanner";

type SolveFor = "acv" | "costPerLead" | "leadToMql" | "mqlToSal" | "salToSql" | "opportunityToClose" | "budget";

interface GoalSeekerProps {
  config: PlannerConfig;
  onApply: (updates: Partial<PlannerConfig>) => void;
  currentBudget: number;
  onBudgetChange: (budget: number) => void;
}

interface SolveOption {
  value: SolveFor;
  label: string;
  unit: string;
}

const SOLVE_OPTIONS: SolveOption[] = [
  { value: "acv", label: "Average Contract Value", unit: "$" },
  { value: "costPerLead", label: "Cost Per Lead", unit: "$" },
  { value: "leadToMql", label: "Lead → MQL Rate", unit: "%" },
  { value: "mqlToSal", label: "MQL → SAL Rate", unit: "%" },
  { value: "salToSql", label: "SAL → SQL Rate", unit: "%" },
  { value: "opportunityToClose", label: "SQL → Close Rate", unit: "%" },
  { value: "budget", label: "Marketing Budget", unit: "$" },
];

export function GoalSeeker({
  config,
  onApply,
  currentBudget,
  onBudgetChange,
}: GoalSeekerProps) {
  const [targetARR, setTargetARR] = useState(1000000);
  const [solveFor, setSolveFor] = useState<SolveFor>("budget");

  const solution = useMemo(() => {
    const overallConversion = 
      (config.leadToMql / 100) *
      (config.mqlToSal / 100) *
      (config.salToSql / 100) *
      (config.opportunityToClose / 100);

    const dealsNeeded = targetARR / config.acv;

    switch (solveFor) {
      case "acv": {
        // ACV = Target ARR / Deals Needed
        // Deals Needed = (Budget / CPL) × Overall Conversion
        const leadsFromBudget = currentBudget / config.costPerLead;
        const dealsFromBudget = leadsFromBudget * overallConversion;
        const requiredACV = dealsFromBudget > 0 ? targetARR / dealsFromBudget : 0;
        return {
          value: Math.round(requiredACV),
          current: config.acv,
          feasible: requiredACV > 0 && requiredACV < 500000,
        };
      }
      case "costPerLead": {
        // CPL = Budget / Leads Needed
        const leadsNeeded = dealsNeeded / overallConversion;
        const requiredCPL = leadsNeeded > 0 ? currentBudget / leadsNeeded : 0;
        return {
          value: Math.round(requiredCPL),
          current: config.costPerLead,
          feasible: requiredCPL > 0 && requiredCPL < 1000,
        };
      }
      case "leadToMql": {
        // Solve for leadToMql given other rates fixed
        const leadsFromBudget = currentBudget / config.costPerLead;
        const requiredOverallRate = dealsNeeded / leadsFromBudget;
        const otherRates = (config.mqlToSal / 100) * (config.salToSql / 100) * (config.opportunityToClose / 100);
        const requiredRate = otherRates > 0 ? (requiredOverallRate / otherRates) * 100 : 0;
        return {
          value: Math.round(requiredRate * 10) / 10,
          current: config.leadToMql,
          feasible: requiredRate > 0 && requiredRate <= 100,
        };
      }
      case "mqlToSal": {
        const leadsFromBudget = currentBudget / config.costPerLead;
        const requiredOverallRate = dealsNeeded / leadsFromBudget;
        const otherRates = (config.leadToMql / 100) * (config.salToSql / 100) * (config.opportunityToClose / 100);
        const requiredRate = otherRates > 0 ? (requiredOverallRate / otherRates) * 100 : 0;
        return {
          value: Math.round(requiredRate * 10) / 10,
          current: config.mqlToSal,
          feasible: requiredRate > 0 && requiredRate <= 100,
        };
      }
      case "salToSql": {
        const leadsFromBudget = currentBudget / config.costPerLead;
        const requiredOverallRate = dealsNeeded / leadsFromBudget;
        const otherRates = (config.leadToMql / 100) * (config.mqlToSal / 100) * (config.opportunityToClose / 100);
        const requiredRate = otherRates > 0 ? (requiredOverallRate / otherRates) * 100 : 0;
        return {
          value: Math.round(requiredRate * 10) / 10,
          current: config.salToSql,
          feasible: requiredRate > 0 && requiredRate <= 100,
        };
      }
      case "opportunityToClose": {
        const leadsFromBudget = currentBudget / config.costPerLead;
        const requiredOverallRate = dealsNeeded / leadsFromBudget;
        const otherRates = (config.leadToMql / 100) * (config.mqlToSal / 100) * (config.salToSql / 100);
        const requiredRate = otherRates > 0 ? (requiredOverallRate / otherRates) * 100 : 0;
        return {
          value: Math.round(requiredRate * 10) / 10,
          current: config.opportunityToClose,
          feasible: requiredRate > 0 && requiredRate <= 100,
        };
      }
      case "budget": {
        // Budget = Leads Needed × CPL
        const leadsNeeded = dealsNeeded / overallConversion;
        const requiredBudget = leadsNeeded * config.costPerLead;
        return {
          value: Math.round(requiredBudget),
          current: currentBudget,
          feasible: requiredBudget > 0,
        };
      }
      default:
        return { value: 0, current: 0, feasible: false };
    }
  }, [targetARR, solveFor, config, currentBudget]);

  const handleApply = () => {
    if (!solution.feasible) return;

    if (solveFor === "budget") {
      onBudgetChange(solution.value);
    } else {
      onApply({ [solveFor]: solution.value });
    }
  };

  const formatValue = (value: number, type: SolveFor) => {
    const option = SOLVE_OPTIONS.find((o) => o.value === type);
    if (option?.unit === "$") {
      return `$${value.toLocaleString()}`;
    }
    return `${value}%`;
  };

  const deltaPercent = solution.current > 0 
    ? ((solution.value - solution.current) / solution.current) * 100 
    : 0;

  return (
    <Card className="border-dashed border-primary/30 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-primary" />
          Goal Seeker
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Work backwards from your revenue goal. Set a target ARR, pick what to solve for, and we'll calculate exactly what that variable needs to be to hit your goal.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm">Target ARR</Label>
          <FormattedNumberInput
            value={targetARR}
            onChange={setTargetARR}
            prefix="$"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Solve for...</Label>
          <Select value={solveFor} onValueChange={(v) => setSolveFor(v as SolveFor)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOLVE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Required Value</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">
                {formatValue(solution.value, solveFor)}
              </span>
              {solution.current !== solution.value && (
                <Badge
                  variant="outline"
                  className={deltaPercent >= 0 ? "text-emerald-500" : "text-rose-500"}
                >
                  {deltaPercent >= 0 ? "+" : ""}
                  {deltaPercent.toFixed(0)}%
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Current: {formatValue(solution.current, solveFor)}</span>
            {!solution.feasible && (
              <Badge variant="destructive" className="text-xs">
                Not Feasible
              </Badge>
            )}
          </div>
        </div>

        <Button
          onClick={handleApply}
          disabled={!solution.feasible}
          className="w-full gap-2"
        >
          <Calculator className="h-4 w-4" />
          Apply {SOLVE_OPTIONS.find((o) => o.value === solveFor)?.label}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
