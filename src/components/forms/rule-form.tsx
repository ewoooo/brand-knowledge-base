"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import type { KnowledgeGraph, RuleCondition } from "@/lib/kg-core/types";

interface RuleFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (rule: {
    name: string;
    expression: string;
    type: "constraint" | "inference" | "validation";
    condition: RuleCondition;
  }) => void;
  graph: KnowledgeGraph;
}

type RuleType = "constraint" | "inference" | "validation";

const OPERATOR_LABELS: Record<RuleCondition["operator"], string> = {
  must_have: "반드시 가져야 한다",
  must_not_have: "가질 수 없다",
  conflicts_with: "충돌하면 안 된다",
};

function buildExpression(condition: RuleCondition): string {
  const { nodeType, predicate, operator, conflictPredicate } = condition;

  if (!nodeType || !predicate) return "";

  switch (operator) {
    case "must_have":
      return `∀x (${nodeType}(x) → ∃y ${predicate}(x, y))`;
    case "must_not_have":
      return `∀x (${nodeType}(x) → ¬∃y ${predicate}(x, y))`;
    case "conflicts_with":
      if (!conflictPredicate) return "";
      return `∀x ∀y (${predicate}(x, y) → ¬${conflictPredicate}(x, y))`;
    default:
      return "";
  }
}

const DEFAULT_CONDITION: RuleCondition = {
  nodeType: "",
  predicate: "",
  operator: "must_have",
  conflictPredicate: "",
};

export function RuleForm({ open, onClose, onSubmit, graph }: RuleFormProps) {
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState<RuleType>("constraint");
  const [condition, setCondition] = useState<RuleCondition>(DEFAULT_CONDITION);

  useEffect(() => {
    if (open) {
      setName("");
      setRuleType("constraint");
      setCondition(DEFAULT_CONDITION);
    }
  }, [open]);

  // Unique node types from the graph
  const nodeTypes = useMemo(() => {
    const types = graph.nodes
      .map((n) => n.type)
      .filter((t): t is string => !!t);
    return Array.from(new Set(types));
  }, [graph.nodes]);

  // Unique predicates from the graph triples
  const predicates = useMemo(() => {
    const preds = graph.triples.map((t) => t.predicate).filter(Boolean);
    return Array.from(new Set(preds));
  }, [graph.triples]);

  const expression = buildExpression(condition);

  const canSubmit =
    name.trim() &&
    condition.nodeType &&
    condition.predicate &&
    (condition.operator !== "conflicts_with" || !!condition.conflictPredicate);

  function updateCondition(patch: Partial<RuleCondition>) {
    setCondition((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      expression,
      type: ruleType,
      condition,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>새 규칙 추가</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Rule name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">규칙 이름</label>
            <Input
              placeholder="규칙 이름 입력"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Rule type toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">규칙 타입</label>
            <ToggleGroup
              type="single"
              value={ruleType}
              onValueChange={(v) => v && setRuleType(v as RuleType)}
              className="justify-start"
            >
              <ToggleGroupItem value="constraint">constraint</ToggleGroupItem>
              <ToggleGroupItem value="inference">inference</ToggleGroupItem>
              <ToggleGroupItem value="validation">validation</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Condition builder */}
          <div className="flex flex-col gap-3 rounded-md border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              조건 설정
            </p>

            {/* Row 1: nodeType */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm whitespace-nowrap">모든</span>
              <Select
                value={condition.nodeType}
                onValueChange={(v) => updateCondition({ nodeType: v })}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="노드 타입 ▾" />
                </SelectTrigger>
                <SelectContent>
                  {nodeTypes.length > 0 ? (
                    nodeTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none__" disabled>
                      타입 없음
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <span className="text-sm whitespace-nowrap">타입 노드는</span>
            </div>

            {/* Row 2: predicate */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={condition.predicate}
                onValueChange={(v) => updateCondition({ predicate: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="predicate ▾" />
                </SelectTrigger>
                <SelectContent>
                  {predicates.length > 0 ? (
                    predicates.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__none__" disabled>
                      관계 없음
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <span className="text-sm whitespace-nowrap">관계를</span>
            </div>

            {/* Row 3: operator */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={condition.operator}
                onValueChange={(v) =>
                  updateCondition({
                    operator: v as RuleCondition["operator"],
                    conflictPredicate: "",
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="조건 선택 ▾" />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(OPERATOR_LABELS) as [
                      RuleCondition["operator"],
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: conflictPredicate (only when operator is conflicts_with) */}
            {condition.operator === "conflicts_with" && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm whitespace-nowrap">충돌 관계:</span>
                <Select
                  value={condition.conflictPredicate ?? ""}
                  onValueChange={(v) => updateCondition({ conflictPredicate: v })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="관계 선택 ▾" />
                  </SelectTrigger>
                  <SelectContent>
                    {predicates.length > 0 ? (
                      predicates.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__none__" disabled>
                        관계 없음
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* FOL preview */}
          {expression && (
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-muted-foreground">
                FOL 표현식 미리보기
              </p>
              <div className="rounded-md bg-muted px-4 py-3 font-mono text-sm">
                {expression}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
