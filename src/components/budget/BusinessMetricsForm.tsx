import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BudgetData, formatCurrency } from "@/lib/budgetCalculations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RotateCcw } from "lucide-react";

interface BusinessMetricsFormProps {
  budgetData: BudgetData;
  setBudgetData: (data: BudgetData) => void;
}

export function BusinessMetricsForm({ budgetData, setBudgetData }: BusinessMetricsFormProps) {
  const updateField = (field: keyof BudgetData, value: number | string | boolean) => {
    setBudgetData({
      ...budgetData,
      [field]: value,
    });
  };

  const formatNumberWithCommas = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '');
    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleNumberInput = (field: keyof BudgetData, value: string) => {
    // Allow empty string and partial numbers during typing
    if (value === '' || value === '-') {
      updateField(field, 0);
      return;
    }
    const parsed = parseFormattedNumber(value);
    updateField(field, parsed);
  };

  const getPercentageValue = (value: number | string): number => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.endsWith('%')) {
        return parseFloat(trimmed.slice(0, -1));
      }
    }
    return 0;
  };

  const updateBudgetCategory = (field: keyof BudgetData, percentage: number) => {
    updateField(field, `${percentage}%`);
  };

  const resetToIndustryStandards = () => {
    setBudgetData({
      ...budgetData,
      leadToMQLRate: 0.29,      // 29% - Industry standard for lead to MQL
      mqlToSQLRate: 0.39,       // 39% - MQL to SQL conversion
      sqlToClosedRate: 0.28,    // 28% - Closed Won rate
    });
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Planning Inputs</CardTitle>
        <CardDescription>
          Adjust values to see real-time calculations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="business" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="funnel">Funnel</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>
          
          <TabsContent value="business" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newARR">New ARR</Label>
              <Input
                id="newARR"
                type="text"
                value={formatNumberWithCommas(budgetData.newARR)}
                onChange={(e) => handleNumberInput('newARR', e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expansionRevenue">Expansion Revenue</Label>
              <Input
                id="expansionRevenue"
                type="text"
                value={formatNumberWithCommas(budgetData.expansionRevenue)}
                onChange={(e) => handleNumberInput('expansionRevenue', e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="partnerARR">Partner ARR</Label>
              <Input
                id="partnerARR"
                type="text"
                value={formatNumberWithCommas(budgetData.partnerARR)}
                onChange={(e) => handleNumberInput('partnerARR', e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="previousARR">Previous Year ARR</Label>
              <Input
                id="previousARR"
                type="text"
                value={formatNumberWithCommas(budgetData.previousARR)}
                onChange={(e) => handleNumberInput('previousARR', e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grossMargin">Gross Margin (%)</Label>
              <Input
                id="grossMargin"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.grossMargin * 100).toFixed(1)}
                onChange={(e) => updateField('grossMargin', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="churnRate">Annual Churn Rate (%)</Label>
              <Input
                id="churnRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.annualChurnRate * 100).toFixed(1)}
                onChange={(e) => updateField('annualChurnRate', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="acv">Average Contract Value</Label>
              <Input
                id="acv"
                type="text"
                value={formatNumberWithCommas(budgetData.averageContractValue)}
                onChange={(e) => handleNumberInput('averageContractValue', e.target.value)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="marketingPercent">Marketing % of Total CAC</Label>
              <Input
                id="marketingPercent"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.marketingSpendPercentage * 100).toFixed(1)}
                onChange={(e) => updateField('marketingSpendPercentage', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="funnel" className="space-y-4 mt-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Funnel Conversion Rates</p>
                <p className="text-xs text-muted-foreground">
                  Adjust rates or reset to B2B SaaS standards
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={resetToIndustryStandards}
                className="h-8 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Standards
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadToMQL">Lead to MQL Rate (%)</Label>
              <Input
                id="leadToMQL"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.leadToMQLRate * 100).toFixed(1)}
                onChange={(e) => updateField('leadToMQLRate', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mqlToSQL">MQL to SQL Rate (%)</Label>
              <Input
                id="mqlToSQL"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.mqlToSQLRate * 100).toFixed(1)}
                onChange={(e) => updateField('mqlToSQLRate', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sqlToClosed">SQL to Closed/Won Rate (%)</Label>
              <Input
                id="sqlToClosed"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.sqlToClosedRate * 100).toFixed(1)}
                onChange={(e) => updateField('sqlToClosedRate', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="mktgPipeline">Marketing % of Pipeline</Label>
              <Input
                id="mktgPipeline"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={(budgetData.marketingPipelinePercentage * 100).toFixed(1)}
                onChange={(e) => updateField('marketingPipelinePercentage', Number(e.target.value) / 100)}
                className="font-mono"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="budget" className="space-y-4 mt-4">
            <div className="space-y-2 pb-4 border-b">
              <Label htmlFor="totalBudget">Total Marketing Budget</Label>
              <Input
                id="totalBudget"
                type="text"
                value={formatNumberWithCommas(budgetData.totalBudget)}
                onChange={(e) => handleNumberInput('totalBudget', e.target.value)}
                className="font-mono font-semibold"
              />
              <p className="text-xs text-muted-foreground">
                Adjust sliders below to allocate budget by percentage
              </p>
            </div>
            
            <div className="space-y-4 pb-4 border-b">
              <div className="flex items-center justify-between">
                <Label htmlFor="includeHeadcount" className="flex flex-col gap-1">
                  <span>Include Headcount</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Toggle to include/exclude Headcount from budget
                  </span>
                </Label>
                <Switch
                  id="includeHeadcount"
                  checked={budgetData.includeHeadcount}
                  onCheckedChange={(checked) => updateField('includeHeadcount', checked)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="demandGen">Demand Gen</Label>
                <span className="text-sm font-mono">
                  {getPercentageValue(budgetData.demandGen).toFixed(1)}% 
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency((getPercentageValue(budgetData.demandGen) / 100) * budgetData.totalBudget)})
                  </span>
                </span>
              </div>
              <Slider
                id="demandGen"
                min={0}
                max={100}
                step={0.1}
                value={[getPercentageValue(budgetData.demandGen)]}
                onValueChange={(value) => updateBudgetCategory('demandGen', value[0])}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="content">Content</Label>
                <span className="text-sm font-mono">
                  {getPercentageValue(budgetData.content).toFixed(1)}% 
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency((getPercentageValue(budgetData.content) / 100) * budgetData.totalBudget)})
                  </span>
                </span>
              </div>
              <Slider
                id="content"
                min={0}
                max={100}
                step={0.1}
                value={[getPercentageValue(budgetData.content)]}
                onValueChange={(value) => updateBudgetCategory('content', value[0])}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="field">Field</Label>
                <span className="text-sm font-mono">
                  {getPercentageValue(budgetData.field).toFixed(1)}% 
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency((getPercentageValue(budgetData.field) / 100) * budgetData.totalBudget)})
                  </span>
                </span>
              </div>
              <Slider
                id="field"
                min={0}
                max={100}
                step={0.1}
                value={[getPercentageValue(budgetData.field)]}
                onValueChange={(value) => updateBudgetCategory('field', value[0])}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="brand">Brand</Label>
                <span className="text-sm font-mono">
                  {getPercentageValue(budgetData.brand).toFixed(1)}% 
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency((getPercentageValue(budgetData.brand) / 100) * budgetData.totalBudget)})
                  </span>
                </span>
              </div>
              <Slider
                id="brand"
                min={0}
                max={100}
                step={0.1}
                value={[getPercentageValue(budgetData.brand)]}
                onValueChange={(value) => updateBudgetCategory('brand', value[0])}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="ecosystem">Ecosystem</Label>
                <span className="text-sm font-mono">
                  {getPercentageValue(budgetData.ecosystem).toFixed(1)}% 
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency((getPercentageValue(budgetData.ecosystem) / 100) * budgetData.totalBudget)})
                  </span>
                </span>
              </div>
              <Slider
                id="ecosystem"
                min={0}
                max={100}
                step={0.1}
                value={[getPercentageValue(budgetData.ecosystem)]}
                onValueChange={(value) => updateBudgetCategory('ecosystem', value[0])}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="martech">MarTech</Label>
                <span className="text-sm font-mono">
                  {getPercentageValue(budgetData.martech).toFixed(1)}% 
                  <span className="text-muted-foreground ml-2">
                    ({formatCurrency((getPercentageValue(budgetData.martech) / 100) * budgetData.totalBudget)})
                  </span>
                </span>
              </div>
              <Slider
                id="martech"
                min={0}
                max={100}
                step={0.1}
                value={[getPercentageValue(budgetData.martech)]}
                onValueChange={(value) => updateBudgetCategory('martech', value[0])}
                className="py-4"
              />
            </div>
            
            {budgetData.includeHeadcount && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="headcount">Headcount</Label>
                  <span className="text-sm font-mono">
                    {getPercentageValue(budgetData.headcount).toFixed(1)}% 
                    <span className="text-muted-foreground ml-2">
                      ({formatCurrency((getPercentageValue(budgetData.headcount) / 100) * budgetData.totalBudget)})
                    </span>
                  </span>
                </div>
                <Slider
                  id="headcount"
                  min={0}
                  max={100}
                  step={0.1}
                  value={[getPercentageValue(budgetData.headcount)]}
                  onValueChange={(value) => updateBudgetCategory('headcount', value[0])}
                  className="py-4"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
