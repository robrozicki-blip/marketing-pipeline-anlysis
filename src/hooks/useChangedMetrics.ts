import { useState, useEffect, useRef, useCallback } from "react";
import { PlannerOutputs } from "./useROIPlanner";

export type ChangedMetricKey =
  | "newARR"
  | "totalLeads"
  | "totalDeals"
  | "totalSpend"
  | "cac"
  | "ltv"
  | "ltvCacRatio"
  | "cacPaybackMonths"
  | "costPerLead"
  | "costPerMql"
  | "costPerOpportunity"
  | "funnel"
  | "pipelineVelocity";

export function useChangedMetrics(outputs: PlannerOutputs) {
  const [changedMetrics, setChangedMetrics] = useState<Set<ChangedMetricKey>>(new Set());
  const prevOutputsRef = useRef<PlannerOutputs | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!prevOutputsRef.current) {
      prevOutputsRef.current = outputs;
      return;
    }

    const prev = prevOutputsRef.current;
    const changed = new Set<ChangedMetricKey>();

    // Check each metric for changes (with small tolerance for floating point)
    const tolerance = 0.01;
    const hasChanged = (a: number, b: number) => Math.abs(a - b) > tolerance;

    if (hasChanged(prev.newARR, outputs.newARR)) changed.add("newARR");
    if (hasChanged(prev.totalLeads, outputs.totalLeads)) changed.add("totalLeads");
    if (hasChanged(prev.totalDeals, outputs.totalDeals)) changed.add("totalDeals");
    if (hasChanged(prev.totalSpend, outputs.totalSpend)) changed.add("totalSpend");
    if (hasChanged(prev.cac, outputs.cac)) changed.add("cac");
    if (hasChanged(prev.ltv, outputs.ltv)) changed.add("ltv");
    if (hasChanged(prev.ltvCacRatio, outputs.ltvCacRatio)) changed.add("ltvCacRatio");
    if (hasChanged(prev.cacPaybackMonths, outputs.cacPaybackMonths)) changed.add("cacPaybackMonths");
    if (hasChanged(prev.costPerLead, outputs.costPerLead)) changed.add("costPerLead");
    if (hasChanged(prev.costPerMql, outputs.costPerMql)) changed.add("costPerMql");
    if (hasChanged(prev.costPerOpportunity, outputs.costPerOpportunity)) changed.add("costPerOpportunity");
    if (hasChanged(prev.pipelineVelocity, outputs.pipelineVelocity)) changed.add("pipelineVelocity");
    
    // Check funnel changes
    if (
      hasChanged(prev.funnel.leads, outputs.funnel.leads) ||
      hasChanged(prev.funnel.mqls, outputs.funnel.mqls) ||
      hasChanged(prev.funnel.sals, outputs.funnel.sals) ||
      hasChanged(prev.funnel.sqls, outputs.funnel.sqls) ||
      hasChanged(prev.funnel.closedWon, outputs.funnel.closedWon)
    ) {
      changed.add("funnel");
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set changed metrics
    if (changed.size > 0) {
      setChangedMetrics(changed);

      // Clear highlights after animation duration
      timeoutRef.current = setTimeout(() => {
        setChangedMetrics(new Set());
      }, 1500);
    }

    prevOutputsRef.current = outputs;
  }, [outputs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const isChanged = useCallback(
    (key: ChangedMetricKey) => changedMetrics.has(key),
    [changedMetrics]
  );

  return { changedMetrics, isChanged };
}
