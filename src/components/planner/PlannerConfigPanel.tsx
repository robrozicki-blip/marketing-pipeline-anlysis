import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Percent,
  TrendingDown,
  TrendingUp,
  Users,
  Target,
  Zap,
  RefreshCw,
  SlidersHorizontal,
  PieChart,
  Building2,
  Handshake,
} from "lucide-react";
import { PlannerConfig, DEFAULT_CONFIG } from "@/hooks/useROIPlanner";
import { InteractiveSlider } from "./InteractiveSlider";
import { QuickAdjustButtons } from "./QuickAdjustButtons";

interface PlannerConfigPanelProps {
  config: PlannerConfig;
  onUpdate: (updates: Partial<PlannerConfig>) => void;
  onReset: () => void;
  targetARR?: number;
}

export function PlannerConfigPanel({
  config,
  onUpdate,
  onReset,
  targetARR = 1000000,
}: PlannerConfigPanelProps) {
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;

  const arrMixNew = num(config.arrMixNew, DEFAULT_CONFIG.arrMixNew);
  const arrMixExpansion = num(config.arrMixExpansion, DEFAULT_CONFIG.arrMixExpansion);
  const arrMixPartner = num(config.arrMixPartner, DEFAULT_CONFIG.arrMixPartner);

  const mktgRespNew = num(config.mktgResponsibilityNew, DEFAULT_CONFIG.mktgResponsibilityNew);
  const mktgRespExpansion = num(config.mktgResponsibilityExpansion, DEFAULT_CONFIG.mktgResponsibilityExpansion);
  const mktgRespPartner = num(config.mktgResponsibilityPartner, DEFAULT_CONFIG.mktgResponsibilityPartner);

  // Calculate ARR mix total for validation
  const arrMixTotal = arrMixNew + arrMixExpansion + arrMixPartner;
  const isArrMixValid = Math.abs(arrMixTotal - 100) < 0.1;

  // Calculate effective marketing ARR for display
  const effectiveMarketingARR = targetARR * (
    (arrMixNew / 100) * (mktgRespNew / 100) +
    (arrMixExpansion / 100) * (mktgRespExpansion / 100) +
    (arrMixPartner / 100) * (mktgRespPartner / 100)
  );

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "$0";
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            Live Controls
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ARR Distribution */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              ARR Distribution
            </h4>
            <Badge variant={isArrMixValid ? "secondary" : "destructive"} className="text-xs">
              {arrMixTotal.toFixed(0)}%
            </Badge>
          </div>
          <InteractiveSlider
            label="New Business"
            value={arrMixNew}
            onChange={(v) => onUpdate({ arrMixNew: v })}
            min={0}
            max={100}
            step={5}
            tooltip="Percentage of target ARR expected from new customer acquisition."
            suffix="%"
            baseline={DEFAULT_CONFIG.arrMixNew}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <InteractiveSlider
            label="Expansion"
            value={arrMixExpansion}
            onChange={(v) => onUpdate({ arrMixExpansion: v })}
            min={0}
            max={100}
            step={5}
            tooltip="Percentage of target ARR expected from upsells and cross-sells to existing customers."
            suffix="%"
            baseline={DEFAULT_CONFIG.arrMixExpansion}
            icon={<Building2 className="h-4 w-4" />}
          />
          <InteractiveSlider
            label="Partner"
            value={arrMixPartner}
            onChange={(v) => onUpdate({ arrMixPartner: v })}
            min={0}
            max={100}
            step={5}
            tooltip="Percentage of target ARR expected from partner-sourced deals."
            suffix="%"
            baseline={DEFAULT_CONFIG.arrMixPartner}
            icon={<Handshake className="h-4 w-4" />}
          />
        </div>

        <Separator />

        {/* Marketing Responsibility per Bucket */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Target className="h-4 w-4" />
              Marketing Responsibility
            </h4>
            <Badge variant="outline" className="text-xs font-medium">
              {formatCurrency(effectiveMarketingARR)} Target
            </Badge>
          </div>
          <InteractiveSlider
            label="New Business"
            value={mktgRespNew}
            onChange={(v) => onUpdate({ mktgResponsibilityNew: v })}
            min={0}
            max={100}
            step={5}
            tooltip="What percentage of new business ARR is marketing responsible for sourcing?"
            suffix="%"
            baseline={DEFAULT_CONFIG.mktgResponsibilityNew}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <InteractiveSlider
            label="Expansion"
            value={mktgRespExpansion}
            onChange={(v) => onUpdate({ mktgResponsibilityExpansion: v })}
            min={0}
            max={100}
            step={5}
            tooltip="What percentage of expansion ARR is marketing responsible for sourcing?"
            suffix="%"
            baseline={DEFAULT_CONFIG.mktgResponsibilityExpansion}
            icon={<Building2 className="h-4 w-4" />}
          />
          <InteractiveSlider
            label="Partner"
            value={mktgRespPartner}
            onChange={(v) => onUpdate({ mktgResponsibilityPartner: v })}
            min={0}
            max={100}
            step={5}
            tooltip="What percentage of partner ARR is marketing responsible for sourcing?"
            suffix="%"
            baseline={DEFAULT_CONFIG.mktgResponsibilityPartner}
            icon={<Handshake className="h-4 w-4" />}
          />
        </div>

        <Separator />

        {/* Sales Cycle */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Sales Cycle
          </h4>
          <InteractiveSlider
            label="Average Sales Cycle"
            value={config.salesCycleDays}
            onChange={(v) => onUpdate({ salesCycleDays: v })}
            min={14}
            max={365}
            step={7}
            tooltip="Average number of days from first touch to closed deal. Affects CAC Payback and Pipeline Velocity calculations."
            suffix=" days"
            baseline={DEFAULT_CONFIG.salesCycleDays}
            icon={<Zap className="h-4 w-4" />}
          />
        </div>

        <Separator />

        {/* Financials */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financials
          </h4>
          <div className="space-y-5">
            <div>
              <InteractiveSlider
                label="Cost Per Lead"
                value={config.costPerLead}
                onChange={(v) => onUpdate({ costPerLead: v })}
                min={10}
                max={1000}
                step={10}
                tooltip="Average cost to acquire one lead"
                prefix="$"
                baseline={DEFAULT_CONFIG.costPerLead}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <QuickAdjustButtons
                value={config.costPerLead}
                onChange={(v) => onUpdate({ costPerLead: v })}
                className="mt-2"
              />
            </div>
            <div>
              <InteractiveSlider
                label="Average Contract Value"
                value={config.acv}
                onChange={(v) => onUpdate({ acv: v })}
                min={1000}
                max={500000}
                step={1000}
                tooltip="Average annual revenue per customer"
                prefix="$"
                baseline={DEFAULT_CONFIG.acv}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <QuickAdjustButtons
                value={config.acv}
                onChange={(v) => onUpdate({ acv: v })}
                className="mt-2"
              />
            </div>
            <InteractiveSlider
              label="Gross Margin"
              value={config.grossMargin}
              onChange={(v) => onUpdate({ grossMargin: v })}
              min={40}
              max={95}
              step={5}
              tooltip="Percentage of revenue remaining after COGS. Affects LTV, LTV:CAC ratio, and Payback Period."
              suffix="%"
              baseline={DEFAULT_CONFIG.grossMargin}
              icon={<Percent className="h-4 w-4" />}
            />
            <InteractiveSlider
              label="Annual Churn Rate"
              value={config.annualChurnRate}
              onChange={(v) => onUpdate({ annualChurnRate: v })}
              min={5}
              max={50}
              step={1}
              tooltip="Percentage of customers lost per year. Affects LTV and LTV:CAC ratio. Lower churn = higher customer lifetime value."
              suffix="%"
              baseline={DEFAULT_CONFIG.annualChurnRate}
              icon={<TrendingDown className="h-4 w-4" />}
            />
          </div>
        </div>

        <Separator />

        {/* Funnel Conversion Rates */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Target className="h-4 w-4" />
            Funnel Rates
          </h4>
          <div className="space-y-5">
            <InteractiveSlider
              label="Lead → MQL"
              value={config.leadToMql}
              onChange={(v) => onUpdate({ leadToMql: v })}
              min={10}
              max={80}
              step={1}
              tooltip="Percentage of leads that become Marketing Qualified Leads"
              suffix="%"
              baseline={DEFAULT_CONFIG.leadToMql}
              icon={<Users className="h-4 w-4" />}
            />
            <InteractiveSlider
              label="MQL → SAL"
              value={config.mqlToSal}
              onChange={(v) => onUpdate({ mqlToSal: v })}
              min={10}
              max={80}
              step={1}
              tooltip="Percentage of MQLs that become Sales Accepted Leads"
              suffix="%"
              baseline={DEFAULT_CONFIG.mqlToSal}
              icon={<Users className="h-4 w-4" />}
            />
            <InteractiveSlider
              label="SAL → SQL"
              value={config.salToSql}
              onChange={(v) => onUpdate({ salToSql: v })}
              min={20}
              max={90}
              step={1}
              tooltip="Percentage of SALs that become Sales Qualified Leads (Opportunities)"
              suffix="%"
              baseline={DEFAULT_CONFIG.salToSql}
              icon={<Target className="h-4 w-4" />}
            />
            <InteractiveSlider
              label="SQL → Closed Won"
              value={config.opportunityToClose}
              onChange={(v) => onUpdate({ opportunityToClose: v })}
              min={5}
              max={50}
              step={1}
              tooltip="Percentage of SQLs (Opportunities) that close as won deals"
              suffix="%"
              baseline={DEFAULT_CONFIG.opportunityToClose}
              icon={<Target className="h-4 w-4" />}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
