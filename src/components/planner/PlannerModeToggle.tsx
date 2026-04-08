import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Target, Wallet, ArrowRight, Info } from "lucide-react";
import { PlanningMode, PlannerOutputs } from "@/hooks/useROIPlanner";

interface PlannerModeToggleProps {
  mode: PlanningMode;
  setMode: (mode: PlanningMode) => void;
  targetARR: number;
  setTargetARR: (value: number) => void;
  yearlyBudget: number;
  setYearlyBudget: (value: number) => void;
  outputs: PlannerOutputs;
}

export function PlannerModeToggle({
  mode,
  setMode,
  targetARR,
  setTargetARR,
  yearlyBudget,
  setYearlyBudget,
  outputs,
}: PlannerModeToggleProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          Planning Mode
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as PlanningMode)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger
              value="goal-led"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Target className="h-4 w-4" />
              Goal-Led
            </TabsTrigger>
            <TabsTrigger
              value="budget-led"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wallet className="h-4 w-4" />
              Budget-Led
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {mode === "goal-led" ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-primary" />
              <span>Work backwards from target ARR to find required budget</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="target-arr" className="font-medium">
                  Target New ARR
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        The annual recurring revenue you want to achieve from new
                        customers
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormattedNumberInput
                id="target-arr"
                value={targetARR}
                onChange={setTargetARR}
                prefix="$"
                className="text-lg font-semibold h-12"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <ArrowRight className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">Required Budget</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(outputs.totalSpend)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              <span>Work forwards from budget to project ARR</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="yearly-budget" className="font-medium">
                  Yearly Marketing Budget
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        Your total annual marketing spend including paid media and
                        fixed costs
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <FormattedNumberInput
                id="yearly-budget"
                value={yearlyBudget}
                onChange={setYearlyBudget}
                prefix="$"
                className="text-lg font-semibold h-12"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <ArrowRight className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium">Projected ARR</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(outputs.newARR)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
