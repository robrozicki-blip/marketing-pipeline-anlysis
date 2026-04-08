import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormattedNumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
}

export function FormattedNumberInput({
  value,
  onChange,
  prefix,
  suffix,
  className,
  ...props
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>("");
  const [isFocused, setIsFocused] = React.useState(false);

  // Format number with thousand separators
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return "";
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(num);
  };

  // Parse formatted string back to number
  const parseNumber = (str: string): number => {
    const cleaned = str.replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Update display value when value prop changes (and not focused)
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatNumber(value));
    }
  }, [value, isFocused]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Show raw number on focus for easier editing
    setDisplayValue(value === 0 ? "" : value.toString());
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const parsed = parseNumber(displayValue);
    onChange(parsed);
    setDisplayValue(formatNumber(parsed));
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow digits, commas, periods, and minus sign
    if (/^-?[\d,]*\.?\d*$/.test(input) || input === "") {
      setDisplayValue(input);
      // Update parent immediately for responsive feedback
      const parsed = parseNumber(input);
      onChange(parsed);
    }
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          prefix && "pl-7",
          suffix && "pr-8",
          className
        )}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
