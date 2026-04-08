import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickAdjustButtonsProps {
  value: number;
  onChange: (value: number) => void;
  adjustments?: number[];
  className?: string;
}

export function QuickAdjustButtons({
  value,
  onChange,
  adjustments = [-20, -10, 10, 20],
  className,
}: QuickAdjustButtonsProps) {
  const handleAdjust = (percent: number) => {
    const newValue = value * (1 + percent / 100);
    onChange(Math.round(newValue));
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {adjustments.map((adj) => (
        <Button
          key={adj}
          variant="outline"
          size="sm"
          onClick={() => handleAdjust(adj)}
          className={cn(
            "h-6 px-2 text-xs font-medium",
            adj < 0 ? "text-rose-500 hover:text-rose-600" : "text-emerald-500 hover:text-emerald-600"
          )}
        >
          {adj > 0 ? "+" : ""}
          {adj}%
        </Button>
      ))}
    </div>
  );
}
