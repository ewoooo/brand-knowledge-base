import { describe, it, expect } from "vitest";
import { nodeColor, nodeSize } from "@/components/graph/canvas-types";
import type { TypeRegistry } from "@knowledgeview/kg-core";

/* ------------------------------------------------------------------ */
/*  TypeRegistry fixture                                               */
/* ------------------------------------------------------------------ */

const registry: TypeRegistry = {
    nodeTypes: [
        {
            type: "brand",
            displayName: "브랜드",
            description: "브랜드 엔티티",
            properties: [],
            visual: { color: "#ff0000", size: 40 },
        },
        {
            type: "color",
            displayName: "색상",
            description: "색상 노드",
            properties: [],
            visual: { color: "#00ff00" },
            // size 생략 → fallback
        },
        {
            type: "typography",
            displayName: "서체",
            description: "서체 노드",
            properties: [],
            // visual 자체 생략 → 전부 fallback
        },
    ],
    linkTypes: [],
};

/* ------------------------------------------------------------------ */
/*  nodeColor                                                          */
/* ------------------------------------------------------------------ */

describe("nodeColor", () => {
    it("schema 없으면 기존 하드코딩 색상 반환", () => {
        expect(nodeColor("brand")).toBe("#6496ff");
    });

    it("schema 있으면 visual.color 사용", () => {
        expect(nodeColor("brand", registry)).toBe("#ff0000");
    });

    it("schema에 해당 타입은 있지만 visual.color 없으면 하드코딩 fallback", () => {
        expect(nodeColor("typography", registry)).toBe("#64ff96");
    });

    it("schema에 해당 타입이 없으면 하드코딩 fallback", () => {
        expect(nodeColor("application", registry)).toBe("#995733");
    });

    it("type이 undefined이면 concept 기본값 반환", () => {
        expect(nodeColor(undefined)).toBe("#888888");
        expect(nodeColor(undefined, registry)).toBe("#888888");
    });

    it("알 수 없는 타입이면 concept 기본값 반환", () => {
        expect(nodeColor("unknown-type")).toBe("#888888");
        expect(nodeColor("unknown-type", registry)).toBe("#888888");
    });
});

/* ------------------------------------------------------------------ */
/*  nodeSize                                                           */
/* ------------------------------------------------------------------ */

describe("nodeSize", () => {
    it("schema 없으면 기존 하드코딩 크기 반환", () => {
        expect(nodeSize("brand")).toBe(36);
    });

    it("schema 있으면 visual.size 사용", () => {
        expect(nodeSize("brand", registry)).toBe(40);
    });

    it("schema에 해당 타입은 있지만 visual.size 없으면 하드코딩 fallback", () => {
        // color는 visual.size 없음
        expect(nodeSize("color", registry)).toBe(20);
    });

    it("schema에 해당 타입이 없으면 하드코딩 fallback", () => {
        expect(nodeSize("application", registry)).toBe(20);
    });

    it("type이 undefined이면 concept 기본값 반환", () => {
        expect(nodeSize(undefined)).toBe(22);
        expect(nodeSize(undefined, registry)).toBe(22);
    });
});
