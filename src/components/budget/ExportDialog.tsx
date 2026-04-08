import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BudgetData, CalculatedMetrics, formatCurrency, formatPercentage } from "@/lib/budgetCalculations";
import { Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  budgetData: BudgetData;
  metrics: CalculatedMetrics;
}

export function ExportDialog({ budgetData, metrics }: ExportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    overview: true,
    budgetBreakdown: true,
    efficiency: true,
    funnel: true,
    monthlySpend: true,
  });

  const exportToCSV = () => {
    let csv = "Marketing Budget Report\n\n";

    if (selectedSections.overview) {
      csv += "Revenue Overview\n";
      csv += "Metric,Value\n";
      csv += `Total ARR,${metrics.totalARR}\n`;
      csv += `New ARR,${metrics.newARR}\n`;
      csv += `Expansion Revenue,${metrics.expansionRevenue}\n`;
      csv += `Partner ARR,${metrics.partnerARR}\n`;
      csv += `Previous ARR,${metrics.previousARR}\n`;
      csv += `Churned Revenue,${metrics.churnedRevenue}\n\n`;
    }

    if (selectedSections.budgetBreakdown) {
      csv += "Budget Breakdown\n";
      csv += "Category,Amount,Percentage\n";
      csv += `Demand Gen,${metrics.budgetBreakdown.demandGen},${metrics.budgetPercentages.demandGen.toFixed(1)}%\n`;
      csv += `Content,${metrics.budgetBreakdown.content},${metrics.budgetPercentages.content.toFixed(1)}%\n`;
      csv += `Field,${metrics.budgetBreakdown.field},${metrics.budgetPercentages.field.toFixed(1)}%\n`;
      csv += `Brand,${metrics.budgetBreakdown.brand},${metrics.budgetPercentages.brand.toFixed(1)}%\n`;
      csv += `Ecosystem,${metrics.budgetBreakdown.ecosystem},${metrics.budgetPercentages.ecosystem.toFixed(1)}%\n`;
      csv += `MarTech,${metrics.budgetBreakdown.martech},${metrics.budgetPercentages.martech.toFixed(1)}%\n`;
      csv += `Headcount,${metrics.budgetBreakdown.headcount},${metrics.budgetPercentages.headcount.toFixed(1)}%\n\n`;
    }

    if (selectedSections.efficiency) {
      csv += "Efficiency Metrics\n";
      csv += "Metric,Value\n";
      csv += `CAC per Customer,${metrics.cacPerCustomer}\n`;
      csv += `CAC Ratio,${metrics.cacRatio.toFixed(2)}\n`;
      csv += `Payback Period,${metrics.paybackPeriod.toFixed(1)} months\n`;
      csv += `LTV:CAC Ratio,${metrics.ltvCacRatio.toFixed(2)}:1\n\n`;
    }

    if (selectedSections.funnel) {
      csv += "Sales Funnel\n";
      csv += "Stage,Count\n";
      csv += `Leads Needed,${Math.round(metrics.leadsNeeded)}\n`;
      csv += `MQLs Needed,${Math.round(metrics.mqlsNeeded)}\n`;
      csv += `SQLs Needed,${Math.round(metrics.sqlsNeeded)}\n`;
      csv += `New Customers,${metrics.totalNewCustomers}\n\n`;
    }

    if (selectedSections.monthlySpend && budgetData.monthlySpend) {
      csv += "Monthly Spend\n";
      csv += "Month,Demand Gen,Content,Field,Brand,Ecosystem,MarTech,Headcount,Total\n";
      budgetData.monthlySpend.forEach(month => {
        const total = month.demandGen + month.content + month.field + 
                     month.brand + month.ecosystem + month.martech + month.headcount;
        csv += `${month.month},${month.demandGen},${month.content},${month.field},${month.brand},${month.ecosystem},${month.martech},${month.headcount},${total}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: "Budget report has been exported to CSV",
    });
    setOpen(false);
  };

  const toggleSection = (section: keyof typeof selectedSections) => {
    setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Budget Report</DialogTitle>
          <DialogDescription>
            Select which sections to include in your export
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overview"
              checked={selectedSections.overview}
              onCheckedChange={() => toggleSection("overview")}
            />
            <Label htmlFor="overview" className="text-sm font-normal cursor-pointer">
              Revenue Overview
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="budgetBreakdown"
              checked={selectedSections.budgetBreakdown}
              onCheckedChange={() => toggleSection("budgetBreakdown")}
            />
            <Label htmlFor="budgetBreakdown" className="text-sm font-normal cursor-pointer">
              Budget Breakdown
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="efficiency"
              checked={selectedSections.efficiency}
              onCheckedChange={() => toggleSection("efficiency")}
            />
            <Label htmlFor="efficiency" className="text-sm font-normal cursor-pointer">
              Efficiency Metrics
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="funnel"
              checked={selectedSections.funnel}
              onCheckedChange={() => toggleSection("funnel")}
            />
            <Label htmlFor="funnel" className="text-sm font-normal cursor-pointer">
              Sales Funnel
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="monthlySpend"
              checked={selectedSections.monthlySpend}
              onCheckedChange={() => toggleSection("monthlySpend")}
            />
            <Label htmlFor="monthlySpend" className="text-sm font-normal cursor-pointer">
              Monthly Spend Data
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={exportToCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
