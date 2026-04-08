import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MonthlySpendChart } from "./MonthlySpendChart";
import { BudgetUpload } from "./BudgetUpload";
import { BudgetVsActual } from "./BudgetVsActual";
import { BudgetData } from "@/lib/budgetCalculations";

interface MonthlySpendSectionProps {
  budgetData: BudgetData;
  onDataUploaded: (data: Partial<BudgetData>) => void;
}

export function MonthlySpendSection({ budgetData, onDataUploaded }: MonthlySpendSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="relative">
        <Badge 
          variant="secondary" 
          className="absolute top-5 right-5 bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]"
        >
          DEV MODE
        </Badge>
        <CardHeader>
          <CardTitle>Monthly Spend Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BudgetUpload onDataUploaded={onDataUploaded} />
          
          {budgetData.monthlySpend && budgetData.monthlySpend.length > 0 && (
            <>
              <BudgetVsActual budgetData={budgetData} />
              <MonthlySpendChart data={budgetData.monthlySpend} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
