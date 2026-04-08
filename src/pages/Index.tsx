import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/budget/Header";
import { MetricsOverview } from "@/components/budget/MetricsOverview";
import { BudgetChatInterface } from "@/components/budget/BudgetChatInterface";
import { BudgetAllocation } from "@/components/budget/BudgetAllocation";
import { EfficiencyMetrics } from "@/components/budget/EfficiencyMetrics";
import { BusinessMetricsForm } from "@/components/budget/BusinessMetricsForm";
import { SalesFunnel } from "@/components/budget/SalesFunnel";
import { ScenarioBuilder } from "@/components/budget/ScenarioBuilder";
import { ShareBudget } from "@/components/budget/ShareBudget";
import { MonthlySpendSection } from "@/components/budget/MonthlySpendSection";
import { ScenarioManager } from "@/components/budget/ScenarioManager";
import { CommentsPanel } from "@/components/budget/CommentsPanel";
import { TrendAnalysis } from "@/components/budget/TrendAnalysis";
import { ROICalculator } from "@/components/budget/ROICalculator";
import { GoalSeeker } from "@/components/budget/GoalSeeker";
import { BudgetData, calculateMetrics } from "@/lib/budgetCalculations";
import { useBudgetData } from "@/hooks/useBudgetData";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, budgetData, saveBudgetData, updateBudgetData, handleSignOut, loading } = useBudgetData();
  const [budgetAdjustment, setBudgetAdjustment] = useState<number>(0);
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);

  const [historicalData] = useState({
    lastYear: {
      newARR: 2000000,
      totalARR: 2000000,
      marketingBudget: 750000,
      totalCAC: 1875000,
    }
  });

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
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
    saveBudgetData(newData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onSignOut={handleSignOut} />
      
      <div className="container mx-auto px-4 pt-6">
        <BudgetChatInterface budgetData={budgetData} />
      </div>
      
      {budgetAdjustment !== 0 && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="container mx-auto px-4 py-2">
            <p className="text-sm text-center">
              <span className="font-semibold">Scenario Mode Active:</span> Showing {budgetAdjustment > 0 ? '+' : ''}{budgetAdjustment}% budget adjustment
            </p>
          </div>
        </div>
      )}
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Overview - Always visible at top */}
        <MetricsOverview 
          metrics={metrics}
          currentMetrics={currentMetrics}
          budgetData={budgetData}
          historicalData={historicalData}
        />
        
        {/* Scenario Planning Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BusinessMetricsForm 
            budgetData={budgetData}
            setBudgetData={handleBudgetDataChange}
          />
          
          <ScenarioBuilder 
            budgetData={budgetData}
            currentMetrics={currentMetrics}
            budgetAdjustment={budgetAdjustment}
            setBudgetAdjustment={setBudgetAdjustment}
            onBudgetDataChange={handleBudgetDataChange}
          />
          
          <SalesFunnel metrics={metrics} />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Primary Content Column */}
          <div className="lg:col-span-8 space-y-6">
            <BudgetAllocation 
              budgetData={displayBudgetData}
              metrics={metrics}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GoalSeeker 
                budgetData={budgetData}
                currentMetrics={currentMetrics}
              />
              <EfficiencyMetrics metrics={metrics} />
            </div>
            
            <ROICalculator metrics={metrics} />
            
            {budgetData.monthlySpend && budgetData.monthlySpend.length > 0 && (
              <TrendAnalysis budgetData={budgetData} />
            )}
          </div>
          
          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-4">
            <ScenarioManager 
              budgetData={budgetData}
              currentScenarioId={currentScenarioId}
              onLoadScenario={(scenario) => {
                handleBudgetDataChange(scenario.budget_data as BudgetData);
                setCurrentScenarioId(scenario.id);
                setBudgetAdjustment(0);
              }}
            />
            
            <CommentsPanel scenarioId={currentScenarioId} />
            
            <ShareBudget budgetData={budgetData} />
          </div>
        </div>
        
        <MonthlySpendSection 
          budgetData={budgetData}
          onDataUploaded={(data) => {
            updateBudgetData(data);
            saveBudgetData({ ...budgetData, ...data });
          }}
        />
      </main>
    </div>
  );
};

export default Index;
