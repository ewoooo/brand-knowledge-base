import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ValidationResult } from "@knowledgeview/kg-core";
import { validate } from "@knowledgeview/kg-core";
import { useGraphStore } from "./graph-store";

export interface ValidationState {
  results: ValidationResult[];
  violatedNodeIds: Set<string>;
  violatedTripleIds: Set<string>;
  passCount: number;
  failCount: number;
}

export const useValidationStore = create<ValidationState>()(
  devtools(
    () => ({
      results: [] as ValidationResult[],
      violatedNodeIds: new Set<string>(),
      violatedTripleIds: new Set<string>(),
      passCount: 0,
      failCount: 0,
    }),
    { name: "validation-store" },
  ),
);

export function setupValidationSubscription() {
  return useGraphStore.subscribe(
    (state) => state.graph,
    (graph) => {
      if (!graph) {
        useValidationStore.setState({
          results: [],
          violatedNodeIds: new Set(),
          violatedTripleIds: new Set(),
          passCount: 0,
          failCount: 0,
        });
        return;
      }

      const results = validate(graph);

      const violatedNodeIds = new Set<string>();
      const violatedTripleIds = new Set<string>();
      for (const result of results) {
        for (const v of result.violations) {
          violatedNodeIds.add(v.nodeId);
          if (v.relatedTripleId) violatedTripleIds.add(v.relatedTripleId);
        }
      }

      useValidationStore.setState({
        results,
        violatedNodeIds,
        violatedTripleIds,
        passCount: results.filter((r) => r.status === "pass").length,
        failCount: results.filter((r) => r.status === "fail").length,
      });
    },
  );
}
