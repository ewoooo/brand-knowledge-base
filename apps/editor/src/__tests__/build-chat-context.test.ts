import { describe, it, expect } from "vitest";
import { buildChatContext } from "@/lib/build-chat-context";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";

const testGraph: KnowledgeGraph = {
    metadata: { name: "테스트 그래프", created: "2024-01-01", updated: "2024-01-01" },
    nodes: [
        { id: "n1", label: "Primary Blue", type: "color" },
        { id: "n2", label: "브랜드 A", type: "brand" },
        { id: "n3", label: "Noto Sans", type: "typography" },
        { id: "n4", label: "모던 컨셉", type: "concept" },
    ],
    triples: [
        { id: "t1", subject: "n2", predicate: "주 색상", object: "n1" },
        { id: "t2", subject: "n2", predicate: "서체", object: "n3" },
        { id: "t3", subject: "n2", predicate: "디자인 컨셉", object: "n4" },
    ],
    rules: [],
};

describe("buildChatContext", () => {
    it("질문에 매칭되는 노드가 있으면 서브그래프 컨텍스트를 반환한다", () => {
        const result = buildChatContext(testGraph, "Primary Blue의 관계를 알려줘");

        // graph-rag 파이프라인의 컨텍스트 형식: "## 지식 그래프 컨텍스트"
        expect(result.context).toContain("지식 그래프 컨텍스트");
        expect(result.context).toContain("Primary Blue");
        expect(result.mode).toBe("rag");
    });

    it("매칭 노드가 없으면 전체 그래프 직렬화로 폴백한다", () => {
        const result = buildChatContext(testGraph, "안녕하세요");

        // serializeGraphForPrompt의 형식: "## 현재 그래프:"
        expect(result.context).toContain("현재 그래프:");
        expect(result.mode).toBe("fallback");
    });

    it("빈 질문이면 전체 그래프 직렬화로 폴백한다", () => {
        const result = buildChatContext(testGraph, "");

        expect(result.context).toContain("현재 그래프:");
        expect(result.mode).toBe("fallback");
    });

    it("RAG 모드에서 관련 관계도 컨텍스트에 포함된다", () => {
        const result = buildChatContext(testGraph, "브랜드 A의 색상이 뭐야?");

        expect(result.context).toContain("브랜드 A");
        expect(result.context).toContain("Primary Blue");
        expect(result.context).toContain("주 색상");
        expect(result.mode).toBe("rag");
    });

    it("비정상 그래프 데이터에서도 폴백으로 동작한다", () => {
        const brokenGraph: KnowledgeGraph = {
            metadata: { name: "broken", created: "", updated: "" },
            nodes: [{ id: "n1", label: "Test" }],
            triples: [{ id: "t1", subject: "missing", predicate: "rel", object: "also-missing" }],
            rules: [],
        };

        // runPipeline이 예외를 던지든 빈 결과를 반환하든 폴백으로 동작해야 함
        const result = buildChatContext(brokenGraph, "Test");
        expect(result.context).toBeTruthy();
        expect(["rag", "fallback"]).toContain(result.mode);
    });
});
