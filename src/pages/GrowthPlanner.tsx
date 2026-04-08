import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Settings,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { useROIPlanner, PlannerConfig, PlanningMode, DEFAULT_CONFIG } from "@/hooks/useROIPlanner";
import { useChangedMetrics } from "@/hooks/useChangedMetrics";
import { PlannerModeToggle } from "@/components/planner/PlannerModeToggle";
import { PlannerConfigPanel } from "@/components/planner/PlannerConfigPanel";
import { MarketingFunnel } from "@/components/planner/MarketingFunnel";
import { PlannerDashboard } from "@/components/planner/PlannerDashboard";
import { BenchmarkComparison } from "@/components/planner/BenchmarkComparison";
import { GoalSeeker } from "@/components/planner/GoalSeeker";
import { PlannerScenarioManager } from "@/components/planner/PlannerScenarioManager";
import { ExecutiveSummaryPanel } from "@/components/planner/ExecutiveSummaryPanel";
import { ModelAssumptions } from "@/components/planner/ModelAssumptions";
import { CalculationBreakdown } from "@/components/planner/CalculationBreakdown";
import { PlannerExportDialog } from "@/components/planner/PlannerExportDialog";
import { PresentationView } from "@/components/planner/PresentationView";
import { useBudgetData } from "@/hooks/useBudgetData";

interface PlannerScenarioData {
  mode: PlanningMode;
  config: PlannerConfig;
  targetARR: number;
  yearlyBudget: number;
}

export default function GrowthPlanner() {
  const navigate = useNavigate();
  const { user, handleSignOut, loading } = useBudgetData();
  const [configOpen, setConfigOpen] = useState(false);
  
  const {
    mode,
    setMode,
    config,
    updateConfig,
    resetConfig,
    targetARR,
    setTargetARR,
    yearlyBudget,
    setYearlyBudget,
    outputs,
    benchmarks,
    setConfig,
  } = useROIPlanner();

  const { changedMetrics } = useChangedMetrics(outputs);

  const handleLoadScenario = useCallback((data: PlannerScenarioData) => {
    setMode(data.mode);
    // Merge defaults so older scenarios don't produce NaN in new fields
    setConfig({ ...DEFAULT_CONFIG, ...data.config });
    setTargetARR(data.targetARR);
    setYearlyBudget(data.yearlyBudget);
  }, [setMode, setConfig, setTargetARR, setYearlyBudget]);

  // Redirect to auth if not logged in
  if (!loading && !user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Growth Planner</h1>
                <p className="text-xs text-muted-foreground">
                  B2B SaaS Marketing ROI
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export & Present Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <PlannerExportDialog
                outputs={outputs}
                config={config}
                mode={mode}
                targetARR={targetARR}
                yearlyBudget={yearlyBudget}
              />
              <PresentationView
                outputs={outputs}
                config={config}
                mode={mode}
                targetARR={targetARR}
                yearlyBudget={yearlyBudget}
              />
            </div>

            {/* Mobile Config Button */}
            <Sheet open={configOpen} onOpenChange={setConfigOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[340px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Configuration</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-60px)]">
                  <div className="p-4 space-y-4">
                    <PlannerScenarioManager
                      mode={mode}
                      config={config}
                      targetARR={targetARR}
                      yearlyBudget={yearlyBudget}
                      onLoadScenario={handleLoadScenario}
                    />
                    <PlannerConfigPanel
                      config={config}
                      onUpdate={updateConfig}
                      onReset={resetConfig}
                      targetARR={targetARR}
                    />
                    <GoalSeeker
                      config={config}
                      onApply={updateConfig}
                      currentBudget={yearlyBudget}
                      onBudgetChange={setYearlyBudget}
                    />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-[320px] shrink-0">
            <div className="sticky top-24 space-y-4">
              <PlannerModeToggle
                mode={mode}
                setMode={setMode}
                targetARR={targetARR}
                setTargetARR={setTargetARR}
                yearlyBudget={yearlyBudget}
                setYearlyBudget={setYearlyBudget}
                outputs={outputs}
              />
              <PlannerScenarioManager
                mode={mode}
                config={config}
                targetARR={targetARR}
                yearlyBudget={yearlyBudget}
                onLoadScenario={handleLoadScenario}
              />
              <ScrollArea className="h-[calc(100vh-520px)]">
                <div className="space-y-4 pr-2">
                  <PlannerConfigPanel
                    config={config}
                    onUpdate={updateConfig}
                    onReset={resetConfig}
                    targetARR={targetARR}
                  />
                  <GoalSeeker
                    config={config}
                    onApply={updateConfig}
                    currentBudget={yearlyBudget}
                    onBudgetChange={setYearlyBudget}
                  />
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Main Dashboard */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Mobile Mode Toggle */}
            <div className="lg:hidden">
              <PlannerModeToggle
                mode={mode}
                setMode={setMode}
                targetARR={targetARR}
                setTargetARR={setTargetARR}
                yearlyBudget={yearlyBudget}
                setYearlyBudget={setYearlyBudget}
                outputs={outputs}
              />
            </div>

            {/* Marketing Funnel */}
            <MarketingFunnel funnel={outputs.funnel} config={config} isHighlighted={changedMetrics.has("funnel")} />

            {/* Dashboard Metrics */}
            <PlannerDashboard
              outputs={outputs}
              benchmarks={benchmarks}
              config={config}
              changedMetrics={changedMetrics}
              mode={mode}
            />

            {/* Executive Summary & OKRs */}
            <ExecutiveSummaryPanel
              outputs={outputs}
              config={config}
              mode={mode}
              targetARR={targetARR}
              yearlyBudget={yearlyBudget}
            />

            {/* Show Math & Assumptions */}
            <CalculationBreakdown
              outputs={outputs}
              config={config}
              mode={mode}
              targetARR={targetARR}
              yearlyBudget={yearlyBudget}
            />
            <ModelAssumptions />

            {/* Benchmark Comparison */}
            <BenchmarkComparison
              config={config}
              outputs={outputs}
              benchmarks={benchmarks}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
