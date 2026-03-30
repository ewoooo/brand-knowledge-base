import type { KnowledgeGraph } from "@knowledgeview/kg-core";

export const BRAND_GRAPH: KnowledgeGraph = {
  metadata: {
    name: "테스트 브랜드",
    created: "2026-01-01",
    updated: "2026-01-01",
  },
  nodes: [
    { id: "brand-a", label: "브랜드A", type: "brand" },
    { id: "color-ff5733", label: "#FF5733", type: "color" },
    { id: "color-333333", label: "#333333", type: "color" },
    { id: "font-pretendard", label: "Pretendard", type: "typography" },
    { id: "tone-warm", label: "따뜻하고 친근한", type: "concept" },
    { id: "brand-b", label: "브랜드B", type: "brand" },
    { id: "font-roboto", label: "Roboto", type: "typography" },
    { id: "tone-cool", label: "차분하고 세련된", type: "concept" },
  ],
  triples: [
    { id: "t1", subject: "brand-a", predicate: "프라이머리컬러", object: "color-ff5733" },
    { id: "t2", subject: "brand-a", predicate: "주서체", object: "font-pretendard" },
    { id: "t3", subject: "brand-a", predicate: "톤앤매너", object: "tone-warm" },
    { id: "t4", subject: "brand-a", predicate: "세컨더리컬러", object: "color-333333" },
    { id: "t5", subject: "brand-b", predicate: "프라이머리컬러", object: "color-333333" },
    { id: "t6", subject: "brand-b", predicate: "주서체", object: "font-roboto" },
    { id: "t7", subject: "brand-b", predicate: "톤앤매너", object: "tone-cool" },
  ],
  rules: [
    {
      id: "r1",
      name: "브랜드는 프라이머리컬러 필요",
      expression: "∀x (brand(x) → ∃y 프라이머리컬러(x, y))",
      type: "constraint",
      condition: {
        nodeType: "brand",
        predicate: "프라이머리컬러",
        operator: "must_have",
      },
    },
  ],
};
