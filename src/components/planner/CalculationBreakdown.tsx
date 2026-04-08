import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Calculator, ChevronDown, TrendingUp, DollarSign, Zap, Activity } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PlannerOutputs, PlannerConfig, PlanningMode } from "@/hooks/useROIPlanner";

interface CalculationBreakdownProps {
  outputs: PlannerOutputs;
  config: PlannerConfig;
  mode: PlanningMode;
  targetARR: number;
  yearlyBudget: number;
}

export function CalculationBreakdown({
  outputs,
  config,
  mode,
  targetARR,
  yearlyBudget,
}: CalculationBreakdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(value));

  const formatPercent = (value: number) => `${value}%`;

  // Calculate derived values for display
  const { arrBreakdown, funnel } = outputs;
  const totalMarketingARR = arrBreakdown.totalMarketingARR;
  const dealsNeeded = totalMarketingARR / config.acv;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Show Math
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-4">
              Step-by-step breakdown of how each metric is calculated.
            </p>
            <Accordion type="multiple" className="w-full">
              {/* ARR Breakdown */}
              <AccordionItem value="arr">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-chart-1" />
                    ARR Breakdown
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm font-mono bg-muted/30 p-3 rounded-lg">
                    <div className="text-muted-foreground">// Target ARR Distribution</div>
                    <div>Target ARR = {formatCurrency(targetARR)}</div>
                    <div className="pl-4">
                      New Business ({formatPercent(config.arrMixNew)}) = {formatCurrency(arrBreakdown.newARR)}
                    </div>
                    <div className="pl-4">
                      Expansion ({formatPercent(config.arrMixExpansion)}) = {formatCurrency(arrBreakdown.expansionARR)}
                    </div>
                    <div className="pl-4">
                      Partner ({formatPercent(config.arrMixPartner)}) = {formatCurrency(arrBreakdown.partnerARR)}
                    </div>
                    <div className="mt-2 text-muted-foreground">// Marketing-Sourced ARR</div>
                    <div className="pl-4">
                      New × {formatPercent(config.mktgResponsibilityNew)} = {formatCurrency(arrBreakdown.marketingNewARR)}
                    </div>
                    <div className="pl-4">
                      Expansion × {formatPercent(config.mktgResponsibilityExpansion)} = {formatCurrency(arrBreakdown.marketingExpansionARR)}
                    </div>
                    <div className="pl-4">
                      Partner × {formatPercent(config.mktgResponsibilityPartner)} = {formatCurrency(arrBreakdown.marketingPartnerARR)}
                    </div>
                    <div className="pt-2 border-t font-bold">
                      Total Marketing ARR = {formatCurrency(totalMarketingARR)}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Funnel Calculation */}
              <AccordionItem value="funnel">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-chart-2" />
                    Funnel Calculation ({mode === "goal-led" ? "Backward" : "Forward"})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm font-mono bg-muted/30 p-3 rounded-lg">
                    {mode === "goal-led" ? (
                      <>
                        <div className="text-muted-foreground">// Working backward from ARR target</div>
                        <div>Deals Needed = Marketing ARR ÷ ACV</div>
                        <div className="pl-4">= {formatCurrency(totalMarketingARR)} ÷ {formatCurrency(config.acv)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(dealsNeeded)} deals</div>
                        <div className="mt-2">SQLs = Deals ÷ Close Rate</div>
                        <div className="pl-4">= {formatNumber(dealsNeeded)} ÷ {formatPercent(config.opportunityToClose)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.sqls)} SQLs</div>
                        <div className="mt-2">SALs = SQLs ÷ SAL→SQL Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.sqls)} ÷ {formatPercent(config.salToSql)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.sals)} SALs</div>
                        <div className="mt-2">MQLs = SALs ÷ MQL→SAL Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.sals)} ÷ {formatPercent(config.mqlToSal)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.mqls)} MQLs</div>
                        <div className="mt-2">Leads = MQLs ÷ Lead→MQL Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.mqls)} ÷ {formatPercent(config.leadToMql)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.leads)} Leads</div>
                      </>
                    ) : (
                      <>
                        <div className="text-muted-foreground">// Working forward from budget</div>
                        <div>Leads = Budget ÷ Cost per Lead</div>
                        <div className="pl-4">= {formatCurrency(yearlyBudget)} ÷ {formatCurrency(config.costPerLead)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.leads)} Leads</div>
                        <div className="mt-2">MQLs = Leads × Lead→MQL Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.leads)} × {formatPercent(config.leadToMql)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.mqls)} MQLs</div>
                        <div className="mt-2">SALs = MQLs × MQL→SAL Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.mqls)} × {formatPercent(config.mqlToSal)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.sals)} SALs</div>
                        <div className="mt-2">SQLs = SALs × SAL→SQL Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.sals)} × {formatPercent(config.salToSql)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.sqls)} SQLs</div>
                        <div className="mt-2">Deals = SQLs × Close Rate</div>
                        <div className="pl-4">= {formatNumber(funnel.sqls)} × {formatPercent(config.opportunityToClose)}</div>
                        <div className="pl-4 font-bold">= {formatNumber(funnel.closedWon)} Deals</div>
                      </>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Budget Calculation */}
              <AccordionItem value="budget">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-chart-3" />
                    Budget & Pipeline
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm font-mono bg-muted/30 p-3 rounded-lg">
                    <div className="text-muted-foreground">// Required Budget</div>
                    <div>Required Spend = Leads × Cost per Lead</div>
                    <div className="pl-4">= {formatNumber(funnel.leads)} × {formatCurrency(config.costPerLead)}</div>
                    <div className="pl-4 font-bold">= {formatCurrency(outputs.totalSpend)}</div>
                    {mode === "goal-led" && (
                      <>
                        <div className="mt-2 text-muted-foreground">// Budget Gap</div>
                        <div>Gap = Required − Available</div>
                        <div className="pl-4">= {formatCurrency(outputs.totalSpend)} − {formatCurrency(yearlyBudget)}</div>
                        <div className={cn(
                          "pl-4 font-bold",
                          outputs.gapAnalysis.budgetGap > 0 ? "text-warning" : "text-success"
                        )}>
                          = {outputs.gapAnalysis.budgetGap > 0 ? "+" : ""}{formatCurrency(outputs.gapAnalysis.budgetGap)}
                        </div>
                      </>
                    )}
                    <div className="mt-2 text-muted-foreground">// Pipeline</div>
                    <div>Pipeline Velocity = (SQLs × Win Rate × ACV) ÷ Sales Cycle Days</div>
                    <div className="pl-4">= ({formatNumber(funnel.sqls)} × {formatPercent(config.opportunityToClose)} × {formatCurrency(config.acv)}) ÷ {config.salesCycleDays}</div>
                    <div className="pl-4 font-bold">= {formatCurrency(outputs.pipelineVelocity)}/day</div>
                    <div className="mt-2">Yearly Pipeline = Velocity × 365</div>
                    <div className="pl-4 font-bold">= {formatCurrency(outputs.yearlyPipeline)}</div>
                    <div className="mt-2 text-muted-foreground">// Pipeline Coverage</div>
                    <div>Required Pipeline = Marketing ARR × 3</div>
                    <div className="pl-4">= {formatCurrency(totalMarketingARR)} × 3 = {formatCurrency(outputs.gapAnalysis.requiredPipeline)}</div>
                    <div>Coverage = Projected ÷ Required ARR</div>
                    <div className="pl-4 font-bold">= {outputs.gapAnalysis.pipelineCoverage.toFixed(1)}×</div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Unit Economics */}
              <AccordionItem value="economics">
                <AccordionTrigger className="text-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-chart-4" />
                    Unit Economics
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm font-mono bg-muted/30 p-3 rounded-lg">
                    <div className="text-muted-foreground">// Customer Acquisition Cost</div>
                    <div>CAC = Total Spend ÷ Closed Deals</div>
                    <div className="pl-4">= {formatCurrency(outputs.totalSpend)} ÷ {formatNumber(outputs.totalDeals)}</div>
                    <div className="pl-4 font-bold">= {formatCurrency(outputs.cac)}</div>
                    
                    <div className="mt-2 text-muted-foreground">// Lifetime Value</div>
                    <div>LTV = ACV × min(1/Churn, 5 years) × Gross Margin</div>
                    <div className="pl-4">= {formatCurrency(config.acv)} × min(1/{formatPercent(config.annualChurnRate)}, 5) × {formatPercent(config.grossMargin)}</div>
                    <div className="pl-4 font-bold">= {formatCurrency(outputs.ltv)}</div>
                    
                    <div className="mt-2 text-muted-foreground">// LTV:CAC Ratio</div>
                    <div>LTV:CAC = LTV ÷ CAC</div>
                    <div className="pl-4">= {formatCurrency(outputs.ltv)} ÷ {formatCurrency(outputs.cac)}</div>
                    <div className="pl-4 font-bold">= {outputs.ltvCacRatio.toFixed(1)}:1</div>
                    
                    <div className="mt-2 text-muted-foreground">// CAC Payback</div>
                    <div>Monthly Gross Profit = (ACV ÷ 12) × Gross Margin</div>
                    <div className="pl-4">= ({formatCurrency(config.acv)} ÷ 12) × {formatPercent(config.grossMargin)}</div>
                    <div className="pl-4">= {formatCurrency((config.acv / 12) * (config.grossMargin / 100))}/mo</div>
                    <div className="mt-2">CAC Payback = (CAC ÷ Monthly GP) + Sales Cycle Months</div>
                    <div className="pl-4">= ({formatCurrency(outputs.cac)} ÷ {formatCurrency((config.acv / 12) * (config.grossMargin / 100))}) + {(config.salesCycleDays / 30).toFixed(1)}</div>
                    <div className="pl-4 font-bold">= {outputs.cacPaybackMonths.toFixed(0)} months</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
