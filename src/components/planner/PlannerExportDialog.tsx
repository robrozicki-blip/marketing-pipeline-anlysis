import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Download, FileText, Table } from "lucide-react";
import { PlannerOutputs, PlannerConfig, PlanningMode } from "@/hooks/useROIPlanner";
import { toast } from "sonner";

interface PlannerExportDialogProps {
  outputs: PlannerOutputs;
  config: PlannerConfig;
  mode: PlanningMode;
  targetARR: number;
  yearlyBudget: number;
}

interface ExportSection {
  id: string;
  label: string;
  description: string;
}

const EXPORT_SECTIONS: ExportSection[] = [
  { id: "summary", label: "Executive Summary", description: "Mode, targets, and key narrative" },
  { id: "funnel", label: "Funnel Metrics", description: "Leads, MQLs, SALs, SQLs, Deals" },
  { id: "economics", label: "Unit Economics", description: "CAC, LTV, ratios, payback" },
  { id: "gaps", label: "Gap Analysis", description: "Budget and pipeline gaps" },
  { id: "assumptions", label: "Model Assumptions", description: "All hardcoded values" },
  { id: "methodology", label: "Calculation Methodology", description: "Formulas used" },
];

export function PlannerExportDialog({
  outputs,
  config,
  mode,
  targetARR,
  yearlyBudget,
}: PlannerExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    new Set(EXPORT_SECTIONS.map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    const newSet = new Set(selectedSections);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSections(newSet);
  };

  const formatCurrency = (value: number) => {
    if (!Number.isFinite(value)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => Math.round(value).toLocaleString();

  const generateCSV = (): string => {
    const lines: string[] = [];
    const date = new Date().toLocaleDateString();

    lines.push("Growth Planner Export");
    lines.push(`Generated,${date}`);
    lines.push(`Mode,${mode === "goal-led" ? "Goal-Led" : "Budget-Led"}`);
    lines.push("");

    if (selectedSections.has("summary")) {
      lines.push("=== EXECUTIVE SUMMARY ===");
      lines.push(`Target ARR,${formatCurrency(targetARR)}`);
      lines.push(`Available Budget,${formatCurrency(yearlyBudget)}`);
      lines.push(`Marketing ARR,${formatCurrency(outputs.newARR)}`);
      lines.push(`Total Leads Required,${formatNumber(outputs.totalLeads)}`);
      lines.push(`Closed Deals,${formatNumber(outputs.totalDeals)}`);
      lines.push("");
    }

    if (selectedSections.has("funnel")) {
      lines.push("=== FUNNEL METRICS ===");
      lines.push("Stage,Volume,Conversion Rate");
      lines.push(`Leads,${formatNumber(outputs.funnel.leads)},—`);
      lines.push(`MQLs,${formatNumber(outputs.funnel.mqls)},${config.leadToMql}%`);
      lines.push(`SALs,${formatNumber(outputs.funnel.sals)},${config.mqlToSal}%`);
      lines.push(`SQLs,${formatNumber(outputs.funnel.sqls)},${config.salToSql}%`);
      lines.push(`Closed Won,${formatNumber(outputs.funnel.closedWon)},${config.opportunityToClose}%`);
      lines.push("");
    }

    if (selectedSections.has("economics")) {
      lines.push("=== UNIT ECONOMICS ===");
      lines.push(`Cost per Lead,${formatCurrency(outputs.costPerLead)}`);
      lines.push(`Cost per MQL,${formatCurrency(outputs.costPerMql)}`);
      lines.push(`Cost per Opportunity,${formatCurrency(outputs.costPerOpportunity)}`);
      lines.push(`Full CAC,${formatCurrency(outputs.cac)}`);
      lines.push(`LTV,${formatCurrency(outputs.ltv)}`);
      lines.push(`LTV:CAC Ratio,${outputs.ltvCacRatio.toFixed(1)}:1`);
      lines.push(`CAC Payback,${outputs.cacPaybackMonths.toFixed(0)} months`);
      lines.push("");
    }

    if (selectedSections.has("gaps")) {
      lines.push("=== GAP ANALYSIS ===");
      lines.push(`Required Budget,${formatCurrency(outputs.gapAnalysis.requiredBudget)}`);
      lines.push(`Budget Gap,${formatCurrency(outputs.gapAnalysis.budgetGap)}`);
      lines.push(`Required Pipeline (3x),${formatCurrency(outputs.gapAnalysis.requiredPipeline)}`);
      lines.push(`Projected Pipeline,${formatCurrency(outputs.gapAnalysis.projectedPipeline)}`);
      lines.push(`Pipeline Gap,${formatCurrency(outputs.gapAnalysis.pipelineGap)}`);
      lines.push(`Pipeline Coverage,${outputs.gapAnalysis.pipelineCoverage.toFixed(1)}x`);
      lines.push("");
    }

    if (selectedSections.has("assumptions")) {
      lines.push("=== MODEL ASSUMPTIONS ===");
      lines.push("Assumption,Value,Rationale");
      lines.push("Pipeline Coverage Target,3× ARR,Industry standard for B2B SaaS");
      lines.push("LTV Cap,5 years,Conservative without historical data");
      lines.push("CAC Payback Target,≤12 months,Healthy SaaS benchmark");
      lines.push("LTV:CAC Target,≥3:1,Sustainable unit economics indicator");
      lines.push("Benchmark Lead→MQL,35%,B2B SaaS industry average");
      lines.push("Benchmark MQL→SAL,45%,B2B SaaS industry average");
      lines.push("Benchmark SAL→SQL,55%,B2B SaaS industry average");
      lines.push("Benchmark SQL→Close,20%,B2B SaaS industry average");
      lines.push("");
    }

    if (selectedSections.has("methodology")) {
      lines.push("=== CALCULATION METHODOLOGY ===");
      lines.push("Metric,Formula");
      lines.push("Marketing ARR,Closed Deals × ACV");
      lines.push("CAC,Total Spend ÷ Closed Deals");
      lines.push("LTV,ACV × min(1/Annual Churn Rate; 5 years) × Gross Margin");
      lines.push("LTV:CAC,LTV ÷ CAC");
      lines.push("CAC Payback,(CAC ÷ Monthly Gross Profit) + Sales Cycle Months");
      lines.push("Pipeline Velocity,(SQLs × Win Rate × ACV) ÷ Sales Cycle Days");
      lines.push("Yearly Pipeline,Pipeline Velocity × 365");
      lines.push("Pipeline Coverage,Projected Pipeline ÷ Marketing ARR");
      lines.push("");
    }

    lines.push("=== CONFIGURATION INPUTS ===");
    lines.push(`ACV,${formatCurrency(config.acv)}`);
    lines.push(`Gross Margin,${config.grossMargin}%`);
    lines.push(`Annual Churn Rate,${config.annualChurnRate}%`);
    lines.push(`Cost per Lead,${formatCurrency(config.costPerLead)}`);
    lines.push(`Sales Cycle,${config.salesCycleDays} days`);
    lines.push(`ARR Mix - New,${config.arrMixNew}%`);
    lines.push(`ARR Mix - Expansion,${config.arrMixExpansion}%`);
    lines.push(`ARR Mix - Partner,${config.arrMixPartner}%`);
    lines.push(`Marketing Responsibility - New,${config.mktgResponsibilityNew}%`);
    lines.push(`Marketing Responsibility - Expansion,${config.mktgResponsibilityExpansion}%`);
    lines.push(`Marketing Responsibility - Partner,${config.mktgResponsibilityPartner}%`);

    return lines.join("\n");
  };

  const generateMarkdown = (): string => {
    const date = new Date().toLocaleDateString();
    let md = "";

    md += `# Growth Planner Report\n\n`;
    md += `**Generated:** ${date}  \n`;
    md += `**Mode:** ${mode === "goal-led" ? "Goal-Led" : "Budget-Led"}\n\n`;

    if (selectedSections.has("summary")) {
      md += `## Executive Summary\n\n`;
      md += `| Metric | Value |\n|--------|-------|\n`;
      md += `| Target ARR | ${formatCurrency(targetARR)} |\n`;
      md += `| Available Budget | ${formatCurrency(yearlyBudget)} |\n`;
      md += `| Marketing ARR | ${formatCurrency(outputs.newARR)} |\n`;
      md += `| Total Leads Required | ${formatNumber(outputs.totalLeads)} |\n`;
      md += `| Closed Deals | ${formatNumber(outputs.totalDeals)} |\n\n`;
    }

    if (selectedSections.has("funnel")) {
      md += `## Funnel Metrics\n\n`;
      md += `| Stage | Volume | Conversion Rate |\n|-------|--------|----------------|\n`;
      md += `| Leads | ${formatNumber(outputs.funnel.leads)} | — |\n`;
      md += `| MQLs | ${formatNumber(outputs.funnel.mqls)} | ${config.leadToMql}% |\n`;
      md += `| SALs | ${formatNumber(outputs.funnel.sals)} | ${config.mqlToSal}% |\n`;
      md += `| SQLs | ${formatNumber(outputs.funnel.sqls)} | ${config.salToSql}% |\n`;
      md += `| Closed Won | ${formatNumber(outputs.funnel.closedWon)} | ${config.opportunityToClose}% |\n\n`;
    }

    if (selectedSections.has("economics")) {
      md += `## Unit Economics\n\n`;
      md += `| Metric | Value |\n|--------|-------|\n`;
      md += `| Cost per Lead | ${formatCurrency(outputs.costPerLead)} |\n`;
      md += `| Cost per MQL | ${formatCurrency(outputs.costPerMql)} |\n`;
      md += `| Cost per Opportunity | ${formatCurrency(outputs.costPerOpportunity)} |\n`;
      md += `| Full CAC | ${formatCurrency(outputs.cac)} |\n`;
      md += `| LTV | ${formatCurrency(outputs.ltv)} |\n`;
      md += `| LTV:CAC Ratio | ${outputs.ltvCacRatio.toFixed(1)}:1 |\n`;
      md += `| CAC Payback | ${outputs.cacPaybackMonths.toFixed(0)} months |\n\n`;
    }

    if (selectedSections.has("gaps")) {
      md += `## Gap Analysis\n\n`;
      md += `| Metric | Value |\n|--------|-------|\n`;
      md += `| Required Budget | ${formatCurrency(outputs.gapAnalysis.requiredBudget)} |\n`;
      md += `| Budget Gap | ${formatCurrency(outputs.gapAnalysis.budgetGap)} |\n`;
      md += `| Required Pipeline (3×) | ${formatCurrency(outputs.gapAnalysis.requiredPipeline)} |\n`;
      md += `| Projected Pipeline | ${formatCurrency(outputs.gapAnalysis.projectedPipeline)} |\n`;
      md += `| Pipeline Gap | ${formatCurrency(outputs.gapAnalysis.pipelineGap)} |\n`;
      md += `| Pipeline Coverage | ${outputs.gapAnalysis.pipelineCoverage.toFixed(1)}× |\n\n`;
    }

    if (selectedSections.has("assumptions")) {
      md += `## Model Assumptions\n\n`;
      md += `| Assumption | Value | Rationale |\n|------------|-------|----------|\n`;
      md += `| Pipeline Coverage Target | 3× ARR | Industry standard for B2B SaaS |\n`;
      md += `| LTV Cap | 5 years | Conservative without historical data |\n`;
      md += `| CAC Payback Target | ≤12 months | Healthy SaaS benchmark |\n`;
      md += `| LTV:CAC Target | ≥3:1 | Sustainable unit economics indicator |\n`;
      md += `| Benchmark Lead→MQL | 35% | B2B SaaS industry average |\n`;
      md += `| Benchmark MQL→SAL | 45% | B2B SaaS industry average |\n`;
      md += `| Benchmark SAL→SQL | 55% | B2B SaaS industry average |\n`;
      md += `| Benchmark SQL→Close | 20% | B2B SaaS industry average |\n\n`;
    }

    if (selectedSections.has("methodology")) {
      md += `## Calculation Methodology\n\n`;
      md += `| Metric | Formula |\n|--------|--------|\n`;
      md += `| Marketing ARR | Closed Deals × ACV |\n`;
      md += `| CAC | Total Spend ÷ Closed Deals |\n`;
      md += `| LTV | ACV × min(1/Annual Churn Rate, 5 years) × Gross Margin |\n`;
      md += `| LTV:CAC | LTV ÷ CAC |\n`;
      md += `| CAC Payback | (CAC ÷ Monthly Gross Profit) + Sales Cycle Months |\n`;
      md += `| Pipeline Velocity | (SQLs × Win Rate × ACV) ÷ Sales Cycle Days |\n`;
      md += `| Yearly Pipeline | Pipeline Velocity × 365 |\n`;
      md += `| Pipeline Coverage | Projected Pipeline ÷ Marketing ARR |\n\n`;
    }

    return md;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (format: "csv" | "markdown") => {
    const date = new Date().toISOString().split("T")[0];
    if (format === "csv") {
      downloadFile(generateCSV(), `growth-planner-${date}.csv`, "text/csv");
      toast.success("CSV exported successfully");
    } else {
      downloadFile(generateMarkdown(), `growth-planner-${date}.md`, "text/markdown");
      toast.success("Markdown exported successfully");
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export Growth Plan</DialogTitle>
          <DialogDescription>
            Select the sections to include in your export. All exports include your configuration inputs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {EXPORT_SECTIONS.map((section) => (
            <div
              key={section.id}
              className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={section.id}
                checked={selectedSections.has(section.id)}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <div className="flex-1">
                <Label htmlFor={section.id} className="cursor-pointer font-medium">
                  {section.label}
                </Label>
                <p className="text-xs text-muted-foreground">{section.description}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("markdown")}
            disabled={selectedSections.size === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          <Button
            onClick={() => handleExport("csv")}
            disabled={selectedSections.size === 0}
          >
            <Table className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
