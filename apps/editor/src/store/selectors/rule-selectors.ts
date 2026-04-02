import type { ValidationResult } from "@knowledgeview/kg-core";
import type { GraphState } from "../graph-store";

export const selectGetRule = (state: GraphState) => (id: string | null) =>
  id ? (state.graph?.rules.find((r) => r.id === id) ?? null) : null;

export const selectUserValidationResults = (
  results: ValidationResult[],
): ValidationResult[] => results.filter((r) => !r.ruleId.startsWith("schema:"));
