import { describe, it, expect } from "vitest";
import { serializeGraphForPrompt, fromJSON, toJSON } from "../serializer";
import type { KnowledgeGraph } from "../types";

describe("serializeGraphForPrompt", () => {
    it("should serialize a graph with nodes, triples, and rules", () => {
        const graph: KnowledgeGraph = {
            metadata: {
                name: "테스트 그래프",
                created: "2026-01-01T00:00:00Z",
                updated: "2026-01-01T00:00:00Z",
            },
            nodes: [
                { id: "n1", label: "브랜드A", type: "brand" },
                { id: "n2", label: "#FF5733", type: "color" },
            ],
            triples: [
                {
                    id: "t1",
                    subject: "n1",
                    predicate: "프라이머리컬러",
                    object: "n2",
                },
            ],
            rules: [
                {
                    id: "r1",
                    name: "브랜드는 프라이머리컬러 필요",
                    expression: "∀x (type(x, brand) → ∃y 프라이머리컬러(x, y))",
                    type: "constraint",
                    condition: {
                        nodeType: "brand",
                        predicate: "프라이머리컬러",
                        operator: "must_have",
                    },
                },
            ],
        };

        const result = serializeGraphForPrompt(graph);

        expect(result).toContain("테스트 그래프");
        expect(result).toContain("브랜드A (brand)");
        expect(result).toContain("#FF5733 (color)");
        expect(result).toContain("브랜드A --[프라이머리컬러]--> #FF5733");
        expect(result).toContain("브랜드는 프라이머리컬러 필요");
    });

    it("should handle empty graph gracefully", () => {
        const graph: KnowledgeGraph = {
            metadata: {
                name: "빈 그래프",
                created: "2026-01-01T00:00:00Z",
                updated: "2026-01-01T00:00:00Z",
            },
            nodes: [],
            triples: [],
            rules: [],
        };
        const result = serializeGraphForPrompt(graph);
        expect(result).toContain("빈 그래프");
        expect(result).toContain("노드 (0개)");
        expect(result).toContain("관계 (0개)");
    });

    it("should handle nodes without type", () => {
        const graph: KnowledgeGraph = {
            metadata: {
                name: "타입 없는 노드",
                created: "2026-01-01T00:00:00Z",
                updated: "2026-01-01T00:00:00Z",
            },
            nodes: [{ id: "n1", label: "미분류 항목" }],
            triples: [],
            rules: [],
        };
        const result = serializeGraphForPrompt(graph);
        expect(result).toContain("미분류 항목");
        expect(result).not.toContain("undefined");
    });
});

describe("fromJSON", () => {
    it("should preserve systemPrompt in metadata", () => {
        const graph: KnowledgeGraph = {
            metadata: {
                name: "프롬프트 테스트",
                created: "2026-01-01",
                updated: "2026-01-01",
                systemPrompt: "당신은 색상 전문가입니다.",
            },
            nodes: [],
            triples: [],
            rules: [],
        };
        const json = toJSON(graph);
        const restored = fromJSON(json);
        expect(restored.metadata.systemPrompt).toBe("당신은 색상 전문가입니다.");
    });

    it("should normalize PascalCase node types on load", () => {
        const json = JSON.stringify({
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            nodes: [
                { id: "n1", label: "브랜드", type: "BrandName" },
                { id: "n2", label: "값", type: "CoreValue" },
                { id: "n3", label: "타입없음" },
            ],
            triples: [],
            rules: [
                {
                    id: "r1", name: "규칙", expression: "", type: "constraint",
                    condition: { nodeType: "BrandName", predicate: "설명", operator: "must_have" },
                },
            ],
        });
        const restored = fromJSON(json);
        expect(restored.nodes[0].type).toBe("brand-name");
        expect(restored.nodes[1].type).toBe("core-value");
        expect(restored.nodes[2].type).toBeUndefined();
        expect(restored.rules[0].condition.nodeType).toBe("brand-name");
    });

    it("should handle missing systemPrompt gracefully", () => {
        const json = JSON.stringify({
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            nodes: [],
            triples: [],
            rules: [],
        });
        const restored = fromJSON(json);
        expect(restored.metadata.systemPrompt).toBeUndefined();
    });
});
