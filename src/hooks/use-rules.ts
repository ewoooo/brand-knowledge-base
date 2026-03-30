"use client";

import { useMemo } from "react";
import type { KnowledgeGraph, ValidationResult } from "@/lib/kg-core/types";
import { validate } from "@/lib/kg-core/validator";

export function useRules(graph: KnowledgeGraph | null) {
  const results = useMemo<ValidationResult[]>(() => {
    if (!graph) return [];
    return validate(graph);
  }, [graph]);

  const violatedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const result of results) {
      for (const v of result.violations) {
        ids.add(v.nodeId);
      }
    }
    return ids;
  }, [results]);

  const violatedTripleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const result of results) {
      for (const v of result.violations) {
        if (v.relatedTripleId) ids.add(v.relatedTripleId);
      }
    }
    return ids;
  }, [results]);

  return {
    results,
    violatedNodeIds,
    violatedTripleIds,
    passCount: results.filter((r) => r.status === "pass").length,
    failCount: results.filter((r) => r.status === "fail").length,
  };
}
