import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  tooltip: string;
  prefix?: string;
  suffix?: string;
  baseline?: number;
  icon?: React.ReactNode;
}

export function InteractiveSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  tooltip,
  prefix = "",
  suffix = "",
  baseline,
  icon,
}: InteractiveSliderProps) {
  // Ensure value is always a valid number (fallback to min if undefined)
  const safeValue = value ?? min;
  
  const showDelta = baseline !== undefined && baseline !== safeValue;
  const delta = baseline !== undefined ? safeValue - baseline : 0;
  const deltaPercent = baseline && baseline !== 0 ? ((safeValue - baseline) / baseline) * 100 : 0;

  const getDeltaColor = () => {
    if (delta > 0) return "text-emerald-500";
    if (delta < 0) return "text-rose-500";
    return "text-muted-foreground";
  };

  const getDeltaIcon = () => {
    if (delta > 0) return <TrendingUp className="h-3 w-3" />;
    if (delta < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const formatValue = (val: number) => {
    const safeVal = val ?? 0;
    if (suffix === "%") return `${safeVal}%`;
    if (prefix === "$") return `$${safeVal.toLocaleString()}`;
    return safeVal.toLocaleString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm font-medium">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[250px]">
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">
            {formatValue(safeValue)}
          </span>
          {showDelta && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-1.5 py-0 h-5 gap-0.5 font-normal",
                getDeltaColor()
              )}
            >
              {getDeltaIcon()}
              {deltaPercent > 0 ? "+" : ""}
              {deltaPercent.toFixed(0)}%
            </Badge>
          )}
        </div>
      </div>
      <div className="pt-1">
        <Slider
          value={[safeValue]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>
    </div>
  );
}
