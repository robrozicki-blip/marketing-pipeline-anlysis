import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BudgetData, CalculatedMetrics, calculateMetrics, formatCurrency } from "@/lib/budgetCalculations";
import { Target, Calculator } from "lucide-react";

interface GoalSeekerProps {
  budgetData: BudgetData;
  currentMetrics: CalculatedMetrics;
}

export function GoalSeeker({ budgetData, currentMetrics }: GoalSeekerProps) {
  const [targetARR, setTargetARR] = useState<string>("");
  const [targetCustomers, setTargetCustomers] = useState<string>("");
  const [targetCAC, setTargetCAC] = useState<string>("");
  const [result, setResult] = useState<any>(null);

  const calculateRequiredBudget = () => {
    let calculatedBudget = 0;
    let calculatedCustomers = 0;
    let calculatedARR = 0;
    let scenario = "";

    // Scenario 1: User wants to achieve a specific ARR
    if (targetARR) {
      const arr = parseFloat(targetARR);
      calculatedCustomers = Math.ceil(arr / budgetData.averageContractValue);
      
      // Use current CAC efficiency to estimate required budget
      const requiredTotalCAC = calculatedCustomers * currentMetrics.cacPerCustomer;
      calculatedBudget = requiredTotalCAC * budgetData.marketingSpendPercentage;
      calculatedARR = arr;
      scenario = "arr";
    }
    // Scenario 2: User wants to acquire a specific number of customers
    else if (targetCustomers) {
      const customers = parseInt(targetCustomers);
      calculatedARR = customers * budgetData.averageContractValue;
      
      const requiredTotalCAC = customers * currentMetrics.cacPerCustomer;
      calculatedBudget = requiredTotalCAC * budgetData.marketingSpendPercentage;
      calculatedCustomers = customers;
      scenario = "customers";
    }
    // Scenario 3: User wants to achieve a specific CAC
    else if (targetCAC) {
      const cac = parseFloat(targetCAC);
      const totalCACNeeded = currentMetrics.totalNewCustomers * cac;
      calculatedBudget = totalCACNeeded * budgetData.marketingSpendPercentage;
      calculatedCustomers = currentMetrics.totalNewCustomers;
      calculatedARR = currentMetrics.newARR;
      scenario = "cac";
    }

    if (calculatedBudget > 0) {
      // Calculate what the metrics would look like with this budget
      const newBudgetData: BudgetData = {
        ...budgetData,
        totalBudget: calculatedBudget,
        newARR: calculatedARR,
      };
      const projectedMetrics = calculateMetrics(newBudgetData);

      setResult({
        requiredBudget: calculatedBudget,
        budgetChange: calculatedBudget - budgetData.totalBudget,
        budgetChangePercent: ((calculatedBudget - budgetData.totalBudget) / budgetData.totalBudget) * 100,
        projectedCustomers: calculatedCustomers,
        projectedARR: calculatedARR,
        projectedCAC: projectedMetrics.cacPerCustomer,
        projectedCACRatio: projectedMetrics.cacRatio,
        projectedPayback: projectedMetrics.paybackPeriod,
        projectedLTVCAC: projectedMetrics.ltvCacRatio,
        scenario,
      });
    }
  };

  const resetCalculator = () => {
    setTargetARR("");
    setTargetCustomers("");
    setTargetCAC("");
    setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Goal Seeker
        </CardTitle>
        <CardDescription>
          Calculate the budget needed to achieve your goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
          <p className="text-xs font-medium">Set Your Goal (choose one):</p>
          
          <div className="space-y-1.5">
            <Label htmlFor="targetARR" className="text-xs">Target New ARR</Label>
            <Input
              id="targetARR"
              type="number"
              placeholder="e.g., 10000000"
              value={targetARR}
              className="h-9 text-sm"
              onChange={(e) => {
                setTargetARR(e.target.value);
                setTargetCustomers("");
                setTargetCAC("");
                setResult(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetCustomers" className="text-xs">Target New Customers</Label>
            <Input
              id="targetCustomers"
              type="number"
              placeholder="e.g., 200"
              value={targetCustomers}
              className="h-9 text-sm"
              onChange={(e) => {
                setTargetCustomers(e.target.value);
                setTargetARR("");
                setTargetCAC("");
                setResult(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="targetCAC" className="text-xs">Target CAC per Customer</Label>
            <Input
              id="targetCAC"
              type="number"
              placeholder="e.g., 5000"
              value={targetCAC}
              className="h-9 text-sm"
              onChange={(e) => {
                setTargetCAC(e.target.value);
                setTargetARR("");
                setTargetCustomers("");
                setResult(null);
              }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button 
              onClick={calculateRequiredBudget} 
              className="flex-1 h-9"
              size="sm"
              disabled={!targetARR && !targetCustomers && !targetCAC}
            >
              <Calculator className="h-3.5 w-3.5 mr-1.5" />
              Calculate
            </Button>
            <Button 
              variant="outline" 
              onClick={resetCalculator}
              className="h-9"
              size="sm"
            >
              Reset
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-3 p-3 border rounded-lg bg-primary/5">
            <h4 className="font-semibold text-sm">Required Investment</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline p-2.5 bg-background rounded-lg">
                <span className="text-xs text-muted-foreground">Marketing Budget Needed</span>
                <span className="text-base font-bold">{formatCurrency(result.requiredBudget)}</span>
              </div>

              <div className="flex justify-between items-baseline p-2.5 bg-background rounded-lg">
                <span className="text-xs text-muted-foreground">Change from Current</span>
                <span className={`text-sm font-semibold ${result.budgetChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.budgetChange >= 0 ? '+' : ''}{formatCurrency(result.budgetChange)}
                  <span className="text-[11px] ml-1.5">
                    ({result.budgetChangePercent >= 0 ? '+' : ''}{result.budgetChangePercent.toFixed(1)}%)
                  </span>
                </span>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <h5 className="font-medium text-xs">Projected Outcomes:</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-[10px]">New ARR</p>
                  <p className="font-semibold text-xs">{formatCurrency(result.projectedARR)}</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-[10px]">New Customers</p>
                  <p className="font-semibold text-xs">{result.projectedCustomers.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-[10px]">CAC per Customer</p>
                  <p className="font-semibold text-xs">{formatCurrency(result.projectedCAC)}</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-[10px]">CAC Ratio</p>
                  <p className="font-semibold text-xs">{result.projectedCACRatio.toFixed(2)}</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-[10px]">Payback Period</p>
                  <p className="font-semibold text-xs">{result.projectedPayback.toFixed(1)} mo</p>
                </div>
                <div className="p-2 bg-background rounded">
                  <p className="text-muted-foreground text-[10px]">LTV:CAC Ratio</p>
                  <p className="font-semibold text-xs">{result.projectedLTVCAC.toFixed(2)}:1</p>
                </div>
              </div>
            </div>

            {result.budgetChangePercent > 50 && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Calculator className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-amber-600">Significant Investment Required</p>
                  <p className="text-[11px] text-muted-foreground">
                    This goal requires a {Math.abs(result.budgetChangePercent).toFixed(0)}% budget 
                    {result.budgetChange >= 0 ? ' increase' : ' decrease'}. 
                    Consider a phased approach or adjusting your targets.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
