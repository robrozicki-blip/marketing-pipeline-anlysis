import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserPlus,
  Star,
  Phone,
  Briefcase,
  Trophy,
} from "lucide-react";
import { FunnelMetrics } from "@/hooks/useROIPlanner";
import { cn } from "@/lib/utils";

interface FunnelStageProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  conversionRate?: number;
  tooltip: string;
}

function FunnelStage({
  icon,
  label,
  value,
  color,
  bgColor,
  conversionRate,
  tooltip,
}: FunnelStageProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`${bgColor} rounded-lg p-4 border-l-4 ${color} cursor-help transition-all hover:shadow-md h-full`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-background/80 shrink-0">
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {value.toLocaleString()}
                </p>
              </div>
            </div>
            {conversionRate !== undefined && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Conv. Rate</span>
                  <span className="text-sm font-semibold">{conversionRate.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface MarketingFunnelProps {
  funnel: FunnelMetrics;
  config: {
    leadToMql: number;
    mqlToSal: number;
    salToSql: number;
    opportunityToClose: number;
  };
  isHighlighted?: boolean;
}

export function MarketingFunnel({ funnel, config, isHighlighted = false }: MarketingFunnelProps) {
  const stages = [
    {
      icon: <UserPlus className="h-5 w-5 text-chart-2" />,
      label: "Leads",
      value: funnel.leads,
      color: "border-chart-2",
      bgColor: "bg-chart-2/5",
      conversionRate: config.leadToMql,
      tooltip:
        "Total leads captured through marketing efforts (form fills, signups, downloads, events, etc.)",
    },
    {
      icon: <Star className="h-5 w-5 text-chart-4" />,
      label: "MQLs",
      value: funnel.mqls,
      color: "border-chart-4",
      bgColor: "bg-chart-4/5",
      conversionRate: config.mqlToSal,
      tooltip:
        "Marketing Qualified Leads - leads that meet marketing criteria (engagement, fit). MQL = Lead × Lead-to-MQL Rate",
    },
    {
      icon: <Phone className="h-5 w-5 text-chart-5" />,
      label: "SALs",
      value: funnel.sals,
      color: "border-chart-5",
      bgColor: "bg-chart-5/5",
      conversionRate: config.salToSql,
      tooltip:
        "Sales Accepted Leads - MQLs reviewed and accepted by sales for follow-up. SAL = MQL × MQL-to-SAL Rate",
    },
    {
      icon: <Briefcase className="h-5 w-5 text-primary" />,
      label: "SQLs",
      value: funnel.sqls,
      color: "border-primary",
      bgColor: "bg-primary/5",
      conversionRate: config.opportunityToClose,
      tooltip:
        "Sales Qualified Leads (=Opportunities) - SALs that become active sales opportunities. SQL = SAL × SAL-to-SQL Rate",
    },
    {
      icon: <Trophy className="h-5 w-5 text-success" />,
      label: "Closed Won",
      value: funnel.closedWon,
      color: "border-success",
      bgColor: "bg-success/5",
      tooltip:
        "Deals that closed successfully as new customers. Won = SQL × SQL-to-Close Rate",
    },
  ];

  // Calculate overall conversion rate (Lead to Close)
  const overallConversion =
    funnel.leads > 0
      ? ((funnel.closedWon / funnel.leads) * 100).toFixed(2)
      : "0";

  return (
    <Card className={cn(
      "transition-all",
      isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg">Marketing Funnel</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full cursor-help">
                  <span className="text-xs text-muted-foreground">
                    Lead-to-Close:
                  </span>
                  <span className="text-sm font-bold text-primary">
                    {overallConversion}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Lead-to-Close Rate = Closed Won / Leads × 100
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {/* Funnel stages grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stages.map((stage) => (
            <FunnelStage key={stage.label} {...stage} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
