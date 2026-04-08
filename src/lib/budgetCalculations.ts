export interface MonthlySpend {
  month: string;
  demandGen: number;
  content: number;
  field: number;
  brand: number;
  ecosystem: number;
  martech: number;
  headcount: number;
}

export interface BudgetData {
  // Business Metrics
  newARR: number;
  expansionRevenue: number;
  partnerARR: number;
  previousARR: number;
  grossMargin: number;
  annualChurnRate: number;
  averageContractValue: number;
  
  // Total Budget
  totalBudget: number;
  
  // Marketing Budget Categories (can be dollar amounts or stored as percentages)
  includeHeadcount: boolean;
  demandGen: number | string;
  content: number | string;
  field: number | string;
  brand: number | string;
  ecosystem: number | string;
  martech: number | string;
  headcount: number | string;
  
  // Sales/Marketing Split
  marketingSpendPercentage: number;
  
  // Funnel Conversion Rates
  leadToMQLRate: number;
  mqlToSQLRate: number;
  sqlToClosedRate: number;
  marketingPipelinePercentage: number;
  
  // Monthly Spend Data
  monthlySpend?: MonthlySpend[];
}

export interface CalculatedMetrics {
  // Revenue Metrics
  totalARR: number;
  newARR: number;
  expansionRevenue: number;
  partnerARR: number;
  previousARR: number;
  churnedRevenue: number;
  
  // Customer Metrics
  totalNewCustomers: number;
  lifetimeValuePerCustomer: number;
  lifetimeValueAllCustomers: number;
  
  // Budget Metrics
  marketingBudget: number;
  salesBudget: number;
  totalCAC: number;
  cacPerCustomer: number;
  idealBudgetNeeded: number;
  
  // Efficiency Metrics
  cacRatio: number;
  paybackPeriod: number;
  ltvCacRatio: number;
  marketingBudgetToNewARR: number;
  marketingBudgetToTotalARR: number;
  
  // Funnel Metrics
  pipelineNeeded: number;
  marketingPipelineNeeded: number;
  sqlsNeeded: number;
  mqlsNeeded: number;
  leadsNeeded: number;
  
  // Budget Breakdown
  budgetBreakdown: {
    demandGen: number;
    content: number;
    field: number;
    brand: number;
    ecosystem: number;
    martech: number;
    headcount: number;
  };
  
  // Percentages
  budgetPercentages: {
    demandGen: number;
    content: number;
    field: number;
    brand: number;
    ecosystem: number;
    martech: number;
    headcount: number;
  };
}

// Helper function to parse budget values (handles both numbers and percentages)
function parseBudgetValue(value: number | string, totalBudget: number): number {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.endsWith('%')) {
      const percentage = parseFloat(trimmed.slice(0, -1));
      return (percentage / 100) * totalBudget;
    }
    return parseFloat(trimmed) || 0;
  }
  return value;
}

export function calculateMetrics(data: BudgetData): CalculatedMetrics {
  // Calculate churned revenue
  const churnedRevenue = data.previousARR * data.annualChurnRate;
  
  // Calculate total ARR (sum of New + Expansion + Partner)
  const totalARR = data.newARR + data.expansionRevenue + data.partnerARR;
  
  // Calculate total new customers
  const totalNewCustomers = Math.round(data.newARR / data.averageContractValue);
  
  // Calculate LTV per customer (handle edge cases for churn rate)
  // LTV = (ACV × Gross Margin) / Annual Churn Rate
  const lifetimeValuePerCustomer = data.annualChurnRate > 0 
    ? (data.averageContractValue * data.grossMargin) / data.annualChurnRate
    : 0;
  
  // Calculate LTV for all new customers
  const lifetimeValueAllCustomers = lifetimeValuePerCustomer * totalNewCustomers;
  
  // Parse budget values (handle percentages) - Demand Gen is always included
  const demandGenAmount = parseBudgetValue(data.demandGen, data.totalBudget);
  const contentAmount = parseBudgetValue(data.content, data.totalBudget);
  const fieldAmount = parseBudgetValue(data.field, data.totalBudget);
  const brandAmount = parseBudgetValue(data.brand, data.totalBudget);
  const ecosystemAmount = parseBudgetValue(data.ecosystem, data.totalBudget);
  const martechAmount = parseBudgetValue(data.martech, data.totalBudget);
  const headcountAmount = data.includeHeadcount ? parseBudgetValue(data.headcount, data.totalBudget) : 0;
  
  // Marketing budget comes directly from the total budget input
  const marketingBudget = data.totalBudget;
  
  // Calculate total CAC
  const totalCAC = marketingBudget / data.marketingSpendPercentage;
  
  // Calculate sales budget
  const salesBudget = totalCAC - marketingBudget;
  
  // Calculate CAC per customer
  const cacPerCustomer = totalCAC / totalNewCustomers;
  
  // Calculate efficiency metrics with proper error handling
  const cacRatio = totalCAC > 0 ? (data.newARR * data.grossMargin) / totalCAC : 0;
  const monthlyACV = data.averageContractValue / 12;
  const monthlyGrossProfit = monthlyACV * data.grossMargin;
  const paybackPeriod = monthlyGrossProfit > 0 ? cacPerCustomer / monthlyGrossProfit : 0;
  const ltvCacRatio = cacPerCustomer > 0 ? lifetimeValuePerCustomer / cacPerCustomer : 0;
  const marketingBudgetToNewARR = data.newARR > 0 ? marketingBudget / data.newARR : 0;
  const marketingBudgetToTotalARR = totalARR > 0 ? marketingBudget / totalARR : 0;
  
  // Calculate budget percentages
  const budgetPercentages = {
    demandGen: (demandGenAmount / marketingBudget) * 100,
    content: (contentAmount / marketingBudget) * 100,
    field: (fieldAmount / marketingBudget) * 100,
    brand: (brandAmount / marketingBudget) * 100,
    ecosystem: (ecosystemAmount / marketingBudget) * 100,
    martech: (martechAmount / marketingBudget) * 100,
    headcount: (headcountAmount / marketingBudget) * 100,
  };
  
  // Calculate funnel metrics
  const sqlsNeeded = totalNewCustomers / data.sqlToClosedRate;
  const mqlsNeeded = sqlsNeeded / data.mqlToSQLRate;
  const leadsNeeded = mqlsNeeded / data.leadToMQLRate;
  const pipelineNeeded = sqlsNeeded * data.averageContractValue;
  const marketingPipelineNeeded = pipelineNeeded * data.marketingPipelinePercentage;
  
  // Calculate ideal budget needed (based on target CAC ratio of 1.0 for efficient spending)
  const targetCACRatio = 1.0;
  const idealTotalCAC = (data.newARR * data.grossMargin) / targetCACRatio;
  const idealBudgetNeeded = idealTotalCAC * data.marketingSpendPercentage;
  
  return {
    totalARR,
    newARR: data.newARR,
    expansionRevenue: data.expansionRevenue,
    partnerARR: data.partnerARR,
    previousARR: data.previousARR,
    churnedRevenue,
    totalNewCustomers,
    lifetimeValuePerCustomer,
    lifetimeValueAllCustomers,
    marketingBudget,
    salesBudget,
    totalCAC,
    cacPerCustomer,
    idealBudgetNeeded,
    cacRatio,
    paybackPeriod,
    ltvCacRatio,
    marketingBudgetToNewARR,
    marketingBudgetToTotalARR,
    pipelineNeeded,
    marketingPipelineNeeded,
    sqlsNeeded,
    mqlsNeeded,
    leadsNeeded,
    budgetBreakdown: {
      demandGen: demandGenAmount,
      content: contentAmount,
      field: fieldAmount,
      brand: brandAmount,
      ecosystem: ecosystemAmount,
      martech: martechAmount,
      headcount: headcountAmount,
    },
    budgetPercentages,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

// ROI Calculation Helper
export function calculateChannelROI(
  channelSpend: number, 
  channelRevenue: number, 
  grossMargin: number
): number {
  if (channelSpend === 0) return 0;
  return ((channelRevenue * grossMargin) - channelSpend) / channelSpend;
}

// Budget Allocation Validation
export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
}

export function validateBudgetAllocation(budgetData: BudgetData): ValidationResult {
  const warnings: string[] = [];
  const metrics = calculateMetrics(budgetData);
  
  // Calculate total allocated
  const totalAllocated = 
    metrics.budgetBreakdown.demandGen +
    metrics.budgetBreakdown.content +
    metrics.budgetBreakdown.field +
    metrics.budgetBreakdown.brand +
    metrics.budgetBreakdown.ecosystem +
    metrics.budgetBreakdown.martech +
    metrics.budgetBreakdown.headcount;
  
  // Check if allocation matches budget (allow small rounding differences)
  if (Math.abs(totalAllocated - budgetData.totalBudget) > 100) {
    warnings.push(
      `Budget allocation mismatch: ${formatCurrency(totalAllocated)} allocated vs ${formatCurrency(budgetData.totalBudget)} budget`
    );
  }
  
  // Check for efficiency warnings
  if (metrics.cacRatio < 0.5) {
    warnings.push(`Low CAC Ratio (${metrics.cacRatio.toFixed(2)}): Consider reducing budget or improving efficiency`);
  }
  
  if (metrics.paybackPeriod > 24) {
    warnings.push(`Long payback period (${metrics.paybackPeriod.toFixed(1)} months): May impact cash flow`);
  }
  
  if (metrics.ltvCacRatio < 3) {
    warnings.push(`Low LTV:CAC ratio (${metrics.ltvCacRatio.toFixed(2)}:1): Target 3:1 or higher for healthy growth`);
  }
  
  return { 
    isValid: warnings.length === 0, 
    warnings 
  };
}

// Goal Seeking Helper
export function calculateRequiredBudget(
  targetARR: number,
  currentData: BudgetData,
  currentMetrics: CalculatedMetrics
): number {
  // Calculate number of customers needed for target ARR
  const targetCustomers = Math.ceil(targetARR / currentData.averageContractValue);
  
  // Use current CAC efficiency to estimate required budget
  const requiredTotalCAC = targetCustomers * currentMetrics.cacPerCustomer;
  
  // Calculate marketing budget based on marketing spend percentage
  return requiredTotalCAC * currentData.marketingSpendPercentage;
}
