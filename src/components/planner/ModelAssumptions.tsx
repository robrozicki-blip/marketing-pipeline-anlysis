import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, ChevronDown, BookOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Assumption {
  name: string;
  value: string;
  rationale: string;
  category: "coverage" | "economics" | "benchmark";
}

const MODEL_ASSUMPTIONS: Assumption[] = [
  {
    name: "Pipeline Coverage Target",
    value: "3× ARR",
    rationale: "Industry standard for B2B SaaS. Having 3× your target in pipeline accounts for deal slippage and win rate variance.",
    category: "coverage",
  },
  {
    name: "LTV Cap",
    value: "5 years",
    rationale: "Conservative estimate without historical cohort data. Prevents overestimating customer lifetime in early-stage companies.",
    category: "economics",
  },
  {
    name: "CAC Payback Target",
    value: "≤12 months",
    rationale: "Healthy SaaS benchmark indicating efficient customer acquisition. Longer payback periods strain cash flow.",
    category: "economics",
  },
  {
    name: "LTV:CAC Target",
    value: "≥3:1",
    rationale: "Indicates sustainable unit economics. Below 3:1 suggests CAC is too high relative to customer value.",
    category: "economics",
  },
  {
    name: "Benchmark Lead→MQL",
    value: "35%",
    rationale: "B2B SaaS industry average based on aggregated benchmark data from marketing automation platforms.",
    category: "benchmark",
  },
  {
    name: "Benchmark MQL→SAL",
    value: "45%",
    rationale: "B2B SaaS industry average. Represents sales acceptance of marketing-qualified leads.",
    category: "benchmark",
  },
  {
    name: "Benchmark SAL→SQL",
    value: "55%",
    rationale: "B2B SaaS industry average. Represents qualification to active opportunity status.",
    category: "benchmark",
  },
  {
    name: "Benchmark SQL→Close",
    value: "20%",
    rationale: "B2B SaaS industry average win rate. Varies significantly by deal size and sales motion.",
    category: "benchmark",
  },
];

const categoryLabels = {
  coverage: "Coverage",
  economics: "Unit Economics",
  benchmark: "Benchmarks",
};

const categoryColors = {
  coverage: "bg-chart-1/10 text-chart-1",
  economics: "bg-chart-2/10 text-chart-2",
  benchmark: "bg-chart-3/10 text-chart-3",
};

export function ModelAssumptions() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Model Assumptions
              </div>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-4">
              These assumptions are baked into the model calculations. Adjust your inputs to reflect your specific business context.
            </p>
            <div className="space-y-2">
              {MODEL_ASSUMPTIONS.map((assumption) => (
                <div
                  key={assumption.name}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      categoryColors[assumption.category]
                    )}>
                      {categoryLabels[assumption.category]}
                    </span>
                    <span className="text-sm">{assumption.name}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[280px]">
                          <p className="text-xs">{assumption.rationale}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="text-sm font-mono font-medium">
                    {assumption.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
