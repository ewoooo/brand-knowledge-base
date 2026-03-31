import { describe, it, expect } from "vitest";
import {
    getFieldsForType,
    getDisplayFields,
} from "@/components/forms/property-editor";
import type { TypeRegistry, PropertyDef } from "@knowledgeview/kg-core";

const colorProps: PropertyDef[] = [
    { key: "hexCode", displayName: "HEX 코드", valueType: "string", required: true, description: "색상의 HEX 코드값" },
    { key: "usage", displayName: "용도", valueType: "string" },
    { key: "category", displayName: "분류", valueType: "enum", enumValues: ["primary", "secondary", "accent", "neutral"] },
];

const registry: TypeRegistry = {
    nodeTypes: [
        { type: "brand", displayName: "브랜드", description: "브랜드 엔티티", properties: [] },
        { type: "color", displayName: "색상", description: "색상 노드", properties: colorProps },
    ],
    linkTypes: [],
};

describe("getFieldsForType", () => {
    it("타입이 있으면 해당 NodeType의 properties 반환", () => {
        const fields = getFieldsForType(registry, "color");
        expect(fields).toHaveLength(3);
        expect(fields[0].key).toBe("hexCode");
    });

    it("타입이 있지만 properties가 비어있으면 빈 배열", () => {
        const fields = getFieldsForType(registry, "brand");
        expect(fields).toHaveLength(0);
    });

    it("schema에 없는 타입이면 빈 배열", () => {
        const fields = getFieldsForType(registry, "unknown");
        expect(fields).toHaveLength(0);
    });

    it("schema가 undefined이면 빈 배열", () => {
        const fields = getFieldsForType(undefined, "color");
        expect(fields).toHaveLength(0);
    });
});

describe("getDisplayFields", () => {
    it("값이 있는 필드만 반환", () => {
        const values = { hexCode: "#2E5BFF", category: "primary" };
        const result = getDisplayFields(colorProps, values);
        expect(result).toHaveLength(2);
        expect(result[0].key).toBe("hexCode");
        expect(result[1].key).toBe("category");
    });

    it("required 필드는 값이 없어도 포함", () => {
        const result = getDisplayFields(colorProps, {});
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe("hexCode");
    });

    it("모든 값이 있으면 전부 반환", () => {
        const values = { hexCode: "#2E5BFF", usage: "Primary", category: "primary" };
        const result = getDisplayFields(colorProps, values);
        expect(result).toHaveLength(3);
    });

    it("properties가 빈 배열이면 빈 배열 반환", () => {
        const result = getDisplayFields([], { foo: "bar" });
        expect(result).toHaveLength(0);
    });

    it("values가 undefined이면 required만 반환", () => {
        const result = getDisplayFields(colorProps, undefined);
        expect(result).toHaveLength(1);
        expect(result[0].key).toBe("hexCode");
    });
});
