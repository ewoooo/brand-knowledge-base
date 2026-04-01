import { describe, it, expect } from "vitest";
import {
    getNodeTypeDisplayName,
    getLinkTypeDisplayName,
    getLinkTypeInfo,
} from "@/lib/resolve-schema-display";
import type { TypeRegistry } from "@knowledgeview/kg-core";

const registry: TypeRegistry = {
    nodeTypes: [
        { type: "brand", displayName: "브랜드", description: "브랜드 엔티티", properties: [] },
        { type: "color", displayName: "색상", description: "색상 노드", properties: [] },
    ],
    linkTypes: [
        {
            predicate: "has-color",
            displayName: "색상을 가짐",
            sourceTypes: ["brand"],
            targetTypes: ["color"],
            cardinality: "1:N",
        },
        {
            predicate: "belongs-to",
            displayName: "소속",
            sourceTypes: ["color"],
            targetTypes: ["brand"],
            cardinality: "N:1",
            description: "소속 관계",
        },
    ],
};

describe("getNodeTypeDisplayName", () => {
    it("schema에서 매칭되는 displayName 반환", () => {
        expect(getNodeTypeDisplayName(registry, "brand")).toBe("브랜드");
        expect(getNodeTypeDisplayName(registry, "color")).toBe("색상");
    });

    it("매칭 안 되면 raw type 반환", () => {
        expect(getNodeTypeDisplayName(registry, "unknown")).toBe("unknown");
    });

    it("schema가 undefined이면 raw type 반환", () => {
        expect(getNodeTypeDisplayName(undefined, "brand")).toBe("brand");
    });
});

describe("getLinkTypeDisplayName", () => {
    it("schema에서 매칭되는 displayName 반환", () => {
        expect(getLinkTypeDisplayName(registry, "has-color")).toBe("색상을 가짐");
    });

    it("매칭 안 되면 raw predicate 반환", () => {
        expect(getLinkTypeDisplayName(registry, "unknown-pred")).toBe("unknown-pred");
    });

    it("schema가 undefined이면 raw predicate 반환", () => {
        expect(getLinkTypeDisplayName(undefined, "has-color")).toBe("has-color");
    });
});

describe("getLinkTypeInfo", () => {
    it("매칭되는 LinkType 정보 반환", () => {
        const info = getLinkTypeInfo(registry, "has-color");
        expect(info).not.toBeNull();
        expect(info!.displayName).toBe("색상을 가짐");
        expect(info!.cardinality).toBe("1:N");
        expect(info!.sourceTypes).toEqual(["brand"]);
        expect(info!.targetTypes).toEqual(["color"]);
    });

    it("매칭 안 되면 null 반환", () => {
        expect(getLinkTypeInfo(registry, "unknown")).toBeNull();
    });

    it("schema가 undefined이면 null 반환", () => {
        expect(getLinkTypeInfo(undefined, "has-color")).toBeNull();
    });
});
