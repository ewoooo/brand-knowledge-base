import { describe, it, expect } from "vitest";
import { serializeGraphForPrompt, fromJSON, toJSON } from "../serializer";
import type { KnowledgeGraph, TypeRegistry } from "../types";

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

    it("should include node type in output", () => {
        const graph: KnowledgeGraph = {
            metadata: {
                name: "타입 있는 노드",
                created: "2026-01-01T00:00:00Z",
                updated: "2026-01-01T00:00:00Z",
            },
            nodes: [{ id: "n1", label: "미분류 항목", type: "unknown" }],
            triples: [],
            rules: [],
        };
        const result = serializeGraphForPrompt(graph);
        expect(result).toContain("미분류 항목 (unknown)");
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

    it("should preserve schema field", () => {
        const schema: TypeRegistry = {
            nodeTypes: [
                { type: "brand", displayName: "브랜드", description: "브랜드 엔티티", properties: [] },
            ],
            linkTypes: [
                { predicate: "has-color", displayName: "색상", sourceTypes: ["brand"], targetTypes: ["color"], cardinality: "1:N" },
            ],
        };
        const json = JSON.stringify({
            metadata: { name: "스키마", created: "2026-01-01", updated: "2026-01-01" },
            schema,
            nodes: [{ id: "n1", label: "A", type: "brand" }],
            triples: [],
            rules: [],
        });
        const restored = fromJSON(json);
        expect(restored.schema).toBeDefined();
        expect(restored.schema?.nodeTypes).toHaveLength(1);
        expect(restored.schema?.nodeTypes[0].description).toBe("브랜드 엔티티");
        expect(restored.schema?.linkTypes).toHaveLength(1);
    });

    it("should preserve Node.props", () => {
        const json = JSON.stringify({
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            nodes: [{ id: "n1", label: "#2E5BFF", type: "color", props: { hexCode: "#2E5BFF" } }],
            triples: [],
            rules: [],
        });
        const restored = fromJSON(json);
        expect(restored.nodes[0].props).toEqual({ hexCode: "#2E5BFF" });
    });

    it("should preserve Triple.metadata", () => {
        const json = JSON.stringify({
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            nodes: [
                { id: "n1", label: "A", type: "brand" },
                { id: "n2", label: "B", type: "color" },
            ],
            triples: [{ id: "t1", subject: "n1", predicate: "has-color", object: "n2", metadata: { source: "manual", confidence: 0.9 } }],
            rules: [],
        });
        const restored = fromJSON(json);
        expect(restored.triples[0].metadata).toEqual({ source: "manual", confidence: 0.9 });
    });

    it("should preserve schemaVersion in metadata", () => {
        const json = JSON.stringify({
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01", schemaVersion: "2.0" },
            nodes: [],
            triples: [],
            rules: [],
        });
        const restored = fromJSON(json);
        expect(restored.metadata.schemaVersion).toBe("2.0");
    });
});

describe("serializeGraphForPrompt (스키마)", () => {
    it("스키마가 있으면 노드 타입 섹션을 출력한다", () => {
        const graph: KnowledgeGraph = {
            metadata: { name: "스키마 그래프", created: "2026-01-01", updated: "2026-01-01" },
            schema: {
                nodeTypes: [
                    { type: "brand", displayName: "브랜드", description: "기업 브랜드 엔티티", properties: [] },
                    {
                        type: "color",
                        displayName: "색상",
                        description: "브랜드 색상",
                        properties: [
                            { key: "hexCode", displayName: "HEX", valueType: "string", required: true },
                        ],
                    },
                ],
                linkTypes: [
                    { predicate: "has-color", displayName: "색상을 가진다", sourceTypes: ["brand"], targetTypes: ["color"], cardinality: "1:N" },
                ],
            },
            nodes: [],
            triples: [],
            rules: [],
        };
        const result = serializeGraphForPrompt(graph);
        expect(result).toContain("스키마");
        expect(result).toContain("brand (브랜드)");
        expect(result).toContain("기업 브랜드 엔티티");
        expect(result).toContain("color (색상)");
        expect(result).toContain("hexCode");
        expect(result).toContain("has-color");
    });

    it("스키마가 없으면 스키마 섹션을 출력하지 않는다", () => {
        const graph: KnowledgeGraph = {
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            nodes: [],
            triples: [],
            rules: [],
        };
        const result = serializeGraphForPrompt(graph);
        expect(result).not.toContain("노드 타입");
        expect(result).not.toContain("관계 타입");
    });
});
