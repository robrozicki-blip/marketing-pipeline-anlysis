import { useState, useMemo } from "react";

export type PlanningMode = "goal-led" | "budget-led";

export interface PlannerConfig {
  // Financials
  acv: number;
  grossMargin: number;
  annualChurnRate: number;

  // Cost basis for calculations
  costPerLead: number;

  // Sales cycle
  salesCycleDays: number;

  // ARR Distribution (must sum to 100%)
  arrMixNew: number;        // % of target ARR from new business
  arrMixExpansion: number;  // % of target ARR from expansion
  arrMixPartner: number;    // % of target ARR from partners

  // Marketing Responsibility per bucket
  mktgResponsibilityNew: number;       // % marketing sources for new business
  mktgResponsibilityExpansion: number; // % marketing sources for expansion
  mktgResponsibilityPartner: number;   // % marketing sources for partner

  // Funnel Conversion Rates (starting from Leads)
  // Leads → MQLs → SALs → SQLs (=Opportunities) → Closed Won
  leadToMql: number;
  mqlToSal: number;
  salToSql: number;
  opportunityToClose: number;
}

export interface FunnelMetrics {
  leads: number;
  mqls: number;
  sals: number;
  sqls: number; // SQLs = Opportunities in this model
  closedWon: number;
}

export interface ARRBreakdown {
  newARR: number;
  expansionARR: number;
  partnerARR: number;
  marketingNewARR: number;
  marketingExpansionARR: number;
  marketingPartnerARR: number;
  totalMarketingARR: number;
}

export interface GapAnalysis {
  requiredBudget: number;
  budgetGap: number;
  requiredPipeline: number;
  projectedPipeline: number;
  pipelineGap: number;
  pipelineCoverage: number;
}

export interface PlannerOutputs {
  funnel: FunnelMetrics;
  newARR: number;
  totalLeads: number;
  totalDeals: number;
  totalSpend: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  cacPaybackMonths: number;
  paidMediaBudget: number;
  // Derived unit costs
  costPerLead: number;
  costPerMql: number;
  costPerOpportunity: number;
  // Pipeline velocity
  pipelineVelocity: number; // $ per day
  yearlyPipeline: number;
  // ARR breakdown and gap analysis
  arrBreakdown: ARRBreakdown;
  gapAnalysis: GapAnalysis;
}

export interface IndustryBenchmarks {
  leadToMql: number;
  mqlToSal: number;
  salToSql: number;
  opportunityToClose: number;
  overallLeadToClose: number;
  targetLtvCacRatio: number;
  targetCacPayback: number;
}

export const DEFAULT_CONFIG: PlannerConfig = {
  acv: 25000,
  grossMargin: 80,
  annualChurnRate: 20,
  costPerLead: 150,
  salesCycleDays: 90,
  // ARR Distribution
  arrMixNew: 70,
  arrMixExpansion: 20,
  arrMixPartner: 10,
  // Marketing Responsibility per bucket
  mktgResponsibilityNew: 60,
  mktgResponsibilityExpansion: 20,
  mktgResponsibilityPartner: 40,
  // Funnel rates
  leadToMql: 40,
  mqlToSal: 50,
  salToSql: 60,
  opportunityToClose: 25,
};

// Calculate overall lead-to-close from individual stage benchmarks
const benchmarkLeadToMql = 35;
const benchmarkMqlToSal = 45;
const benchmarkSalToSql = 55;
const benchmarkOpportunityToClose = 20;
const calculatedOverallLeadToClose = 
  (benchmarkLeadToMql / 100) *
  (benchmarkMqlToSal / 100) *
  (benchmarkSalToSql / 100) *
  (benchmarkOpportunityToClose / 100) *
  100;

export const INDUSTRY_BENCHMARKS: IndustryBenchmarks = {
  leadToMql: benchmarkLeadToMql,
  mqlToSal: benchmarkMqlToSal,
  salToSql: benchmarkSalToSql,
  opportunityToClose: benchmarkOpportunityToClose,
  overallLeadToClose: calculatedOverallLeadToClose, // ~1.73% (35% × 45% × 55% × 20%)
  targetLtvCacRatio: 3,
  targetCacPayback: 12,
};

function calculateFunnelForward(leads: number, config: PlannerConfig): FunnelMetrics {
  const mqls = leads * (config.leadToMql / 100);
  const sals = mqls * (config.mqlToSal / 100);
  const sqls = sals * (config.salToSql / 100); // SQLs = Opportunities
  const closedWon = sqls * (config.opportunityToClose / 100);

  // Only round at the end for display, keep precise values for calculations
  return {
    leads: Math.round(leads),
    mqls: Math.round(mqls),
    sals: Math.round(sals),
    sqls: Math.round(sqls), // SQLs = Opportunities
    closedWon, // Keep as float for accurate ARR calculations
  };
}

function calculateFunnelBackward(targetDeals: number, config: PlannerConfig): FunnelMetrics {
  const sqls = targetDeals / (config.opportunityToClose / 100); // SQLs = Opportunities
  const sals = sqls / (config.salToSql / 100);
  const mqls = sals / (config.mqlToSal / 100);
  const leads = mqls / (config.leadToMql / 100);

  // Keep leads as float for accurate budget calculation
  return {
    leads, // Keep as float for accurate budget = leads × CPL
    mqls: Math.round(mqls),
    sals: Math.round(sals),
    sqls: Math.round(sqls), // SQLs = Opportunities
    closedWon: targetDeals,
  };
}

function calculateLTV(acv: number, grossMargin: number, annualChurnRate: number): number {
  if (annualChurnRate <= 0) return acv * 5 * (grossMargin / 100); // Cap at 5 years if no churn
  const avgLifetimeYears = Math.min(1 / (annualChurnRate / 100), 5); // Cap at 5 years max
  return acv * avgLifetimeYears * (grossMargin / 100);
}

export function useROIPlanner() {
  const [mode, setMode] = useState<PlanningMode>("goal-led");
  const [config, setConfig] = useState<PlannerConfig>(DEFAULT_CONFIG);
  const [targetARR, setTargetARR] = useState<number>(1000000);
  const [yearlyBudget, setYearlyBudget] = useState<number>(600000);

  const outputs = useMemo<PlannerOutputs>(() => {
    // Defensive defaults: old saved scenarios may not include newly-added config fields
    const cfg: PlannerConfig = { ...DEFAULT_CONFIG, ...config };

    const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

    // Sanitize denominators to avoid NaN/Infinity propagation
    const acv = isFiniteNumber(cfg.acv) && cfg.acv > 0 ? cfg.acv : DEFAULT_CONFIG.acv;
    const inputCpl = isFiniteNumber(cfg.costPerLead) && cfg.costPerLead > 0 ? cfg.costPerLead : DEFAULT_CONFIG.costPerLead;
    const salesCycleDays = isFiniteNumber(cfg.salesCycleDays) && cfg.salesCycleDays > 0 ? cfg.salesCycleDays : DEFAULT_CONFIG.salesCycleDays;
    const winRatePct = isFiniteNumber(cfg.opportunityToClose) && cfg.opportunityToClose > 0 ? cfg.opportunityToClose : DEFAULT_CONFIG.opportunityToClose;
    const winRate = Math.max(winRatePct / 100, 0.0001);

    const grossMargin = isFiniteNumber(cfg.grossMargin) ? cfg.grossMargin : DEFAULT_CONFIG.grossMargin;
    const annualChurnRate = isFiniteNumber(cfg.annualChurnRate) ? cfg.annualChurnRate : DEFAULT_CONFIG.annualChurnRate;

    // Allow 0 for mix/responsibility, but never allow NaN/undefined
    const arrMixNew = isFiniteNumber(cfg.arrMixNew) ? cfg.arrMixNew : DEFAULT_CONFIG.arrMixNew;
    const arrMixExpansion = isFiniteNumber(cfg.arrMixExpansion) ? cfg.arrMixExpansion : DEFAULT_CONFIG.arrMixExpansion;
    const arrMixPartner = isFiniteNumber(cfg.arrMixPartner) ? cfg.arrMixPartner : DEFAULT_CONFIG.arrMixPartner;

    const mktgRespNew = isFiniteNumber(cfg.mktgResponsibilityNew) ? cfg.mktgResponsibilityNew : DEFAULT_CONFIG.mktgResponsibilityNew;
    const mktgRespExpansion = isFiniteNumber(cfg.mktgResponsibilityExpansion) ? cfg.mktgResponsibilityExpansion : DEFAULT_CONFIG.mktgResponsibilityExpansion;
    const mktgRespPartner = isFiniteNumber(cfg.mktgResponsibilityPartner) ? cfg.mktgResponsibilityPartner : DEFAULT_CONFIG.mktgResponsibilityPartner;

    const safeCfg: PlannerConfig = {
      ...cfg,
      acv,
      costPerLead: inputCpl,
      salesCycleDays,
      opportunityToClose: winRatePct,
      arrMixNew,
      arrMixExpansion,
      arrMixPartner,
      mktgResponsibilityNew: mktgRespNew,
      mktgResponsibilityExpansion: mktgRespExpansion,
      mktgResponsibilityPartner: mktgRespPartner,
      grossMargin,
      annualChurnRate,
    };

    // Calculate ARR breakdown
    const newBusinessARR = targetARR * (arrMixNew / 100);
    const expansionARR = targetARR * (arrMixExpansion / 100);
    const partnerARR = targetARR * (arrMixPartner / 100);

    // Calculate marketing-sourced ARR per bucket
    const marketingNewARR = newBusinessARR * (mktgRespNew / 100);
    const marketingExpansionARR = expansionARR * (mktgRespExpansion / 100);
    const marketingPartnerARR = partnerARR * (mktgRespPartner / 100);
    const totalMarketingARR = marketingNewARR + marketingExpansionARR + marketingPartnerARR;

    const arrBreakdown: ARRBreakdown = {
      newARR: newBusinessARR,
      expansionARR,
      partnerARR,
      marketingNewARR,
      marketingExpansionARR,
      marketingPartnerARR,
      totalMarketingARR,
    };

    let funnel: FunnelMetrics;
    let totalSpend: number;
    let paidMediaBudget: number;

    if (mode === "goal-led") {
      // Work backward from Total Marketing ARR
      const dealsNeeded = totalMarketingARR / acv;
      funnel = calculateFunnelBackward(dealsNeeded, safeCfg);
      // Calculate required budget based on leads needed × CPL
      totalSpend = funnel.leads * inputCpl;
      paidMediaBudget = totalSpend;
    } else {
      // Work forward from Yearly Budget
      const leads = yearlyBudget / Math.max(inputCpl, 1);
      funnel = calculateFunnelForward(leads > 0 ? leads : 1, safeCfg);
      paidMediaBudget = yearlyBudget;
      totalSpend = yearlyBudget;
    }

    const newARR = funnel.closedWon * acv;

    const cac = funnel.closedWon > 0 ? totalSpend / funnel.closedWon : 0;
    const ltv = calculateLTV(acv, grossMargin, annualChurnRate);
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    // CAC Payback = (CAC / Monthly Gross Profit) + (Sales Cycle in months)
    const monthlyRevenue = acv / 12;
    const monthlyGrossProfit = monthlyRevenue * (grossMargin / 100);
    const salesCycleMonths = salesCycleDays / 30;
    const cacPaybackMonths = monthlyGrossProfit > 0 ? (cac / monthlyGrossProfit) + salesCycleMonths : salesCycleMonths;

    // Derived unit costs
    const derivedCostPerLead = funnel.leads > 0 ? totalSpend / funnel.leads : 0;
    const costPerMql = funnel.mqls > 0 ? totalSpend / funnel.mqls : 0;
    const costPerOpportunity = funnel.sqls > 0 ? totalSpend / funnel.sqls : 0;

    // Pipeline Velocity = (# of SQLs × Win Rate × ACV) / Sales Cycle Days
    const rawSqls = mode === "goal-led" ? (totalMarketingARR / acv) / winRate : funnel.sqls;
    const pipelineVelocity = salesCycleDays > 0 ? (rawSqls * winRate * acv) / salesCycleDays : 0;

    // Yearly Pipeline = Pipeline Velocity × 365
    const yearlyPipeline = pipelineVelocity * 365;

    // Gap analysis
    const requiredPipeline = totalMarketingARR * 3; // 3x coverage
    const projectedPipeline = yearlyPipeline;
    const pipelineGap = requiredPipeline - projectedPipeline;
    const pipelineCoverage = totalMarketingARR > 0 ? (projectedPipeline / totalMarketingARR) : 0;

    // Budget gap: in goal-led mode, compare required budget (totalSpend) vs available budget (yearlyBudget)
    const requiredBudget = totalSpend;
    const budgetGap = mode === "goal-led" ? totalSpend - yearlyBudget : 0;

    const gapAnalysis: GapAnalysis = {
      requiredBudget,
      budgetGap,
      requiredPipeline,
      projectedPipeline,
      pipelineGap,
      pipelineCoverage,
    };

    // Round display values but keep calculation precision
    return {
      funnel: {
        leads: Math.round(funnel.leads),
        mqls: funnel.mqls,
        sals: funnel.sals,
        sqls: funnel.sqls,
        closedWon: Math.round(funnel.closedWon),
      },
      newARR,
      totalLeads: Math.round(funnel.leads),
      totalDeals: Math.round(funnel.closedWon),
      totalSpend,
      cac,
      ltv,
      ltvCacRatio,
      cacPaybackMonths,
      paidMediaBudget,
      costPerLead: derivedCostPerLead,
      costPerMql,
      costPerOpportunity,
      pipelineVelocity,
      yearlyPipeline,
      arrBreakdown,
      gapAnalysis,
    };
  }, [mode, config, targetARR, yearlyBudget]);

  const updateConfig = (updates: Partial<PlannerConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const resetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  return {
    mode,
    setMode,
    config,
    setConfig,
    updateConfig,
    resetConfig,
    targetARR,
    setTargetARR,
    yearlyBudget,
    setYearlyBudget,
    outputs,
    benchmarks: INDUSTRY_BENCHMARKS,
  };
}
