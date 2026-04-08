import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, Check } from "lucide-react";
import { BudgetData } from "@/lib/budgetCalculations";

interface ShareBudgetProps {
  budgetData: BudgetData;
}

export function ShareBudget({ budgetData }: ShareBudgetProps) {
  const [shareLink, setShareLink] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateShareLink = async () => {
    setLoading(true);
    try {
      // Generate random share ID
      const shareId = Math.random().toString(36).substring(2, 10);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("shared_budgets")
        .insert({
          share_id: shareId,
          created_by: user?.id,
          new_arr: budgetData.newARR,
          expansion_revenue: budgetData.expansionRevenue,
          partner_arr: budgetData.partnerARR,
          previous_arr: budgetData.previousARR,
          gross_margin: budgetData.grossMargin,
          annual_churn_rate: budgetData.annualChurnRate,
          average_contract_value: budgetData.averageContractValue,
          total_budget: budgetData.totalBudget,
          include_headcount: budgetData.includeHeadcount,
          demand_gen: budgetData.demandGen.toString(),
          content: budgetData.content.toString(),
          field: budgetData.field.toString(),
          brand: budgetData.brand.toString(),
          ecosystem: budgetData.ecosystem.toString(),
          martech: budgetData.martech.toString(),
          headcount: budgetData.headcount.toString(),
          marketing_spend_percentage: budgetData.marketingSpendPercentage,
          lead_to_mql_rate: budgetData.leadToMQLRate,
          mql_to_sql_rate: budgetData.mqlToSQLRate,
          sql_to_closed_rate: budgetData.sqlToClosedRate,
          marketing_pipeline_percentage: budgetData.marketingPipelinePercentage,
        });

      if (error) throw error;

      const link = `${window.location.origin}/shared/${shareId}`;
      setShareLink(link);
      
      toast({
        title: "Share link created!",
        description: "Anyone with this link can view and adjust your budget.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error creating share link:", error);
      }
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Budget
        </CardTitle>
        <CardDescription>
          Create a link to share your budget configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shareLink ? (
          <Button 
            onClick={generateShareLink} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Creating..." : "Generate Share Link"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input 
                value={shareLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button 
              variant="secondary"
              onClick={generateShareLink}
              disabled={loading}
              className="w-full"
            >
              Generate New Link
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
