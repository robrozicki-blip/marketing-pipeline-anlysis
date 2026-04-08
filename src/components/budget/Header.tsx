import { TrendingUp, LogOut, User, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExportDialog } from "./ExportDialog";
import { AlertsManager } from "./AlertsManager";
import { TeamCollaboration } from "./TeamCollaboration";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { BudgetData, CalculatedMetrics } from "@/lib/budgetCalculations";

interface HeaderProps {
  user?: SupabaseUser | null;
  onSignOut?: () => void;
  budgetData?: BudgetData;
  metrics?: CalculatedMetrics;
}

export function Header({ user, onSignOut, budgetData, metrics }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Marketing Budget Planner
              </h1>
              <p className="text-sm text-muted-foreground">
                B2B SaaS Budget Planning & Analysis
              </p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <Link to="/growth-planner">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Growth Planner
                </Button>
              </Link>
              {budgetData && metrics && (
                <>
                  <ExportDialog budgetData={budgetData} metrics={metrics} />
                  <AlertsManager />
                  <TeamCollaboration />
                </>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
