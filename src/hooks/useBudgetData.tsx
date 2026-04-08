import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BudgetData } from "@/lib/budgetCalculations";
import { useToast } from "@/hooks/use-toast";
import type { User, Session } from "@supabase/supabase-js";

const defaultBudgetData: BudgetData = {
  newARR: 5000000,
  expansionRevenue: 1000000,
  partnerARR: 500000,
  previousARR: 8000000,
  grossMargin: 0.8,
  annualChurnRate: 0.15,
  averageContractValue: 50000,
  totalBudget: 2000000,
  includeHeadcount: true,
  demandGen: "30%",
  content: "15%",
  field: "20%",
  brand: "10%",
  ecosystem: "10%",
  martech: "5%",
  headcount: "10%",
  marketingSpendPercentage: 0.6,
  leadToMQLRate: 0.29,
  mqlToSQLRate: 0.39,
  sqlToClosedRate: 0.28,
  marketingPipelinePercentage: 0.7,
};

export function useBudgetData() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData>(defaultBudgetData);
  const [loading, setLoading] = useState(true);

  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            loadBudgetData(session.user.id);
          }, 0);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        loadBudgetData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadBudgetData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Load monthly spend data
        const { data: spendData } = await supabase
          .from("actual_spend")
          .select("*")
          .eq("user_id", userId)
          .order("month");

        // Group spend by month and category
        const monthlySpend: any[] = [];
        if (spendData) {
          const months = [...new Set(spendData.map(s => s.month))];
          months.forEach(month => {
            const monthData = spendData.filter(s => s.month === month);
            monthlySpend.push({
              month,
              demandGen: Number(monthData.find(s => s.category === 'demandGen')?.amount || 0),
              content: Number(monthData.find(s => s.category === 'content')?.amount || 0),
              field: Number(monthData.find(s => s.category === 'field')?.amount || 0),
              brand: Number(monthData.find(s => s.category === 'brand')?.amount || 0),
              ecosystem: Number(monthData.find(s => s.category === 'ecosystem')?.amount || 0),
              martech: Number(monthData.find(s => s.category === 'martech')?.amount || 0),
              headcount: Number(monthData.find(s => s.category === 'headcount')?.amount || 0),
            });
          });
        }

        setBudgetData({
          newARR: Number(data.new_arr),
          expansionRevenue: Number(data.expansion_revenue),
          partnerARR: Number(data.partner_arr),
          previousARR: Number(data.previous_arr),
          grossMargin: Number(data.gross_margin),
          annualChurnRate: Number(data.annual_churn_rate),
          averageContractValue: Number(data.average_contract_value),
          totalBudget: Number(data.total_budget),
          includeHeadcount: data.include_headcount,
          demandGen: data.demand_gen,
          content: data.content,
          field: data.field,
          brand: data.brand,
          ecosystem: data.ecosystem,
          martech: data.martech,
          headcount: data.headcount,
          marketingSpendPercentage: Number(data.marketing_spend_percentage),
          leadToMQLRate: Number(data.lead_to_mql_rate),
          mqlToSQLRate: Number(data.mql_to_sql_rate),
          sqlToClosedRate: Number(data.sql_to_closed_rate),
          marketingPipelinePercentage: Number(data.marketing_pipeline_percentage),
          monthlySpend: monthlySpend.length > 0 ? monthlySpend : undefined,
        });
      }
    } catch (error) {
      console.error("Error loading budget data:", error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetData = async (data: BudgetData) => {
    if (!user) return;

    // Update state immediately (optimistic update) so calculations reflect changes instantly
    setBudgetData(data);

    try {
      const { error } = await supabase
        .from("budgets")
        .upsert({
          user_id: user.id,
          new_arr: data.newARR,
          expansion_revenue: data.expansionRevenue,
          partner_arr: data.partnerARR,
          previous_arr: data.previousARR,
          gross_margin: data.grossMargin,
          annual_churn_rate: data.annualChurnRate,
          average_contract_value: data.averageContractValue,
          total_budget: data.totalBudget,
          include_headcount: data.includeHeadcount,
          demand_gen: data.demandGen.toString(),
          content: data.content.toString(),
          field: data.field.toString(),
          brand: data.brand.toString(),
          ecosystem: data.ecosystem.toString(),
          martech: data.martech.toString(),
          headcount: data.headcount.toString(),
          marketing_spend_percentage: data.marketingSpendPercentage,
          lead_to_mql_rate: data.leadToMQLRate,
          mql_to_sql_rate: data.mqlToSQLRate,
          sql_to_closed_rate: data.sqlToClosedRate,
          marketing_pipeline_percentage: data.marketingPipelinePercentage,
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving budget data:", error);
      toast({
        title: "Error",
        description: "Failed to save budget data",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const updateBudgetData = (data: Partial<BudgetData>) => {
    setBudgetData(prev => ({ ...prev, ...data }));
  };

  return {
    user,
    session,
    budgetData,
    setBudgetData,
    updateBudgetData,
    saveBudgetData,
    handleSignOut,
    loading,
  };
}
