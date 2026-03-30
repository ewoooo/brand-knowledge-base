import { describe, it, expect } from "vitest";
import { extractMentionedNodeIds } from "@/lib/extract-mentioned-nodes";
import type { Node } from "@knowledgeview/kg-core";

const nodes: Node[] = [
    { id: "n1", label: "Primary Blue", type: "color" },
    { id: "n2", label: "브랜드 A", type: "brand" },
    { id: "n3", label: "Noto Sans", type: "typography" },
    { id: "n4", label: "AB", type: "concept" },
];

describe("extractMentionedNodeIds", () => {
    it("텍스트에 언급된 노드 ID를 반환한다", () => {
        const text = "Primary Blue는 브랜드 A의 주 색상입니다.";
        const result = extractMentionedNodeIds(text, nodes);
        expect(result).toContain("n1");
        expect(result).toContain("n2");
    });

    it("언급된 노드가 없으면 빈 배열을 반환한다", () => {
        const result = extractMentionedNodeIds("안녕하세요", nodes);
        expect(result).toEqual([]);
    });

    it("중복 없이 반환한다", () => {
        const text = "Primary Blue의 보조색도 Primary Blue와 유사합니다.";
        const result = extractMentionedNodeIds(text, nodes);
        expect(result.filter((id) => id === "n1")).toHaveLength(1);
    });

    it("2글자 미만 라벨은 무시한다", () => {
        const shortNodes: Node[] = [{ id: "s1", label: "A" }];
        const result = extractMentionedNodeIds("A는 좋은 브랜드", shortNodes);
        expect(result).toEqual([]);
    });

    it("등장 순서대로 반환한다", () => {
        const text = "Noto Sans는 브랜드 A에서 사용합니다.";
        const result = extractMentionedNodeIds(text, nodes);
        expect(result).toEqual(["n3", "n2"]);
    });
});
