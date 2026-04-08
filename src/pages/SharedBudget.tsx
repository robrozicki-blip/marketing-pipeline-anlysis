import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/budget/Header";
import { MetricsOverview } from "@/components/budget/MetricsOverview";
import { BudgetAllocation } from "@/components/budget/BudgetAllocation";
import { EfficiencyMetrics } from "@/components/budget/EfficiencyMetrics";
import { BusinessMetricsForm } from "@/components/budget/BusinessMetricsForm";
import { SalesFunnel } from "@/components/budget/SalesFunnel";
import { ScenarioBuilder } from "@/components/budget/ScenarioBuilder";
import { BudgetData, calculateMetrics } from "@/lib/budgetCalculations";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SharedBudget() {
  const { shareId } = useParams();
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [budgetAdjustment, setBudgetAdjustment] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [historicalData] = useState({
    lastYear: {
      newARR: 2000000,
      totalARR: 2000000,
      marketingBudget: 750000,
      totalCAC: 1875000,
    }
  });

  useEffect(() => {
    loadSharedBudget();
  }, [shareId]);

  const loadSharedBudget = async () => {
    try {
      const { data, error } = await supabase
        .from("shared_budgets")
        .select("*")
        .eq("share_id", shareId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setError("Shared budget not found");
        return;
      }

      // Convert database format to BudgetData
      setBudgetData({
        newARR: Number(data.new_arr),
        expansionRevenue: Number(data.expansion_revenue),
        partnerARR: Number(data.partner_arr),
        previousARR: Number(data.previous_arr),
        grossMargin: Number(data.gross_margin),
        annualChurnRate: Number(data.annual_churn_rate),
        averageContractValue: Number(data.average_contract_value),
        totalBudget: Number(data.total_budget),
        includeHeadcount: data.include_headcount,
        demandGen: data.demand_gen,
        content: data.content,
        field: data.field,
        brand: data.brand,
        ecosystem: data.ecosystem,
        martech: data.martech,
        headcount: data.headcount,
        marketingSpendPercentage: Number(data.marketing_spend_percentage),
        leadToMQLRate: Number(data.lead_to_mql_rate),
        mqlToSQLRate: Number(data.mql_to_sql_rate),
        sqlToClosedRate: Number(data.sql_to_closed_rate),
        marketingPipelinePercentage: Number(data.marketing_pipeline_percentage),
      });

      // Increment view count
      await supabase
        .from("shared_budgets")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("share_id", shareId);

    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading shared budget:", error);
      }
      setError("Failed to load shared budget");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !budgetData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Budget not found"}
            </AlertDescription>
          </Alert>
        </main>
      </div>
    );
  }

  // Calculate scenario data based on budget adjustment
  const adjustedBudget = budgetData.totalBudget * (1 + budgetAdjustment / 100);
  const budgetMultiplier = adjustedBudget / budgetData.totalBudget;
  const adjustedNewARR = budgetData.newARR * budgetMultiplier;
  
  const displayBudgetData: BudgetData = budgetAdjustment !== 0 ? {
    ...budgetData,
    totalBudget: adjustedBudget,
    newARR: adjustedNewARR,
  } : budgetData;

  const metrics = calculateMetrics(displayBudgetData);
  const currentMetrics = calculateMetrics(budgetData);

  const handleBudgetDataChange = (newData: BudgetData) => {
    setBudgetData(newData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="bg-primary/10 border-b border-primary/20">
        <div className="container mx-auto px-4 py-3">
          <p className="text-sm text-center">
            <span className="font-semibold">Shared Budget View</span> - Changes you make are local only and won't affect the original budget
          </p>
        </div>
      </div>
      
      {budgetAdjustment !== 0 && (
        <div className="bg-accent/10 border-b border-accent/20">
          <div className="container mx-auto px-4 py-2">
            <p className="text-sm text-center">
              <span className="font-semibold">Scenario Mode Active:</span> Showing {budgetAdjustment > 0 ? '+' : ''}{budgetAdjustment}% budget adjustment
            </p>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <MetricsOverview 
          metrics={metrics}
          currentMetrics={currentMetrics}
          budgetData={budgetData}
          historicalData={historicalData}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BudgetAllocation 
              budgetData={displayBudgetData}
              metrics={metrics}
            />
            <SalesFunnel metrics={metrics} />
            <EfficiencyMetrics 
              metrics={metrics}
            />
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <ScenarioBuilder 
              budgetData={budgetData}
              currentMetrics={currentMetrics}
              budgetAdjustment={budgetAdjustment}
              setBudgetAdjustment={setBudgetAdjustment}
              onBudgetDataChange={handleBudgetDataChange}
            />
            <BusinessMetricsForm 
              budgetData={budgetData}
              setBudgetData={handleBudgetDataChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
