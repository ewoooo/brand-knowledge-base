import { validate } from "@knowledgeview/kg-core";
import type { KnowledgeGraph, Rule, TypeRegistry } from "@knowledgeview/kg-core";
import type { SubGraph } from "./types";

interface BuildContextOptions {
  rules?: Rule[];
  schema?: TypeRegistry;
}

export function buildContext(
  subgraph: SubGraph,
  options: BuildContextOptions = {}
): string {
  if (subgraph.nodes.length === 0) {
    return "## 지식 그래프 컨텍스트\n\n관련 정보를 찾을 수 없습니다.";
  }

  const nodeMap = new Map(subgraph.nodes.map((n) => [n.id, n]));
  const nodeTypeMap = options.schema
    ? new Map(options.schema.nodeTypes.map((nt) => [nt.type, nt]))
    : null;

  const entityLines = subgraph.nodes.map((n) => {
    const type = ` (${n.type})`;
    const nodeType = nodeTypeMap?.get(n.type);
    const desc = nodeType ? ` — ${nodeType.description}` : "";
    const propsStr = n.props && Object.keys(n.props).length > 0
      ? ` [${Object.entries(n.props).map(([k, v]) => `${k}: ${v}`).join(", ")}]`
      : "";
    return `- ${n.label}${type}${desc}${propsStr}`;
  });

  const relationLines = subgraph.triples.map((t) => {
    const subject = nodeMap.get(t.subject)?.label ?? t.subject;
    const object = nodeMap.get(t.object)?.label ?? t.object;
    return `- ${subject}의 ${t.predicate}은(는) ${object}이다.`;
  });

  const sections: string[] = [
    "## 지식 그래프 컨텍스트",
    "",
    "다음은 질문과 관련된 온톨로지 정보입니다:",
    "",
    "### 엔티티",
    ...entityLines,
    "",
    "### 관계",
    ...(relationLines.length > 0 ? relationLines : ["(관계 없음)"]),
  ];

  if (options.rules && options.rules.length > 0) {
    const miniGraph: KnowledgeGraph = {
      metadata: { name: "", created: "", updated: "" },
      nodes: subgraph.nodes,
      triples: subgraph.triples,
      rules: options.rules,
    };

    const results = validate(miniGraph);
    const failures = results.filter((r) => r.status === "fail");

    sections.push("", "### 규칙 검증");

    if (failures.length === 0) {
      sections.push("- 모든 규칙을 통과함.");
    } else {
      for (const failure of failures) {
        for (const v of failure.violations) {
          sections.push(`- 주의: ${failure.ruleName} — ${v.message}`);
        }
      }
    }
  }

  return sections.join("\n");
}
