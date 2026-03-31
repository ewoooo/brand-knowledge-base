import { describe, it, expect } from "vitest";
import type {
    NodeType,
    LinkType,
    PropertyDef,
    TypeRegistry,
    TripleMetadata,
    Node,
    Triple,
    KnowledgeGraph,
} from "../types";

// --- 테스트용 스키마 팩토리 ---

function makeNodeType(overrides: Partial<NodeType> = {}): NodeType {
    return {
        type: "brand",
        displayName: "브랜드",
        description: "기업/제품 브랜드 엔티티",
        properties: [],
        ...overrides,
    };
}

function makeLinkType(overrides: Partial<LinkType> = {}): LinkType {
    return {
        predicate: "has-color",
        displayName: "색상을 가진다",
        sourceTypes: ["brand"],
        targetTypes: ["color"],
        cardinality: "1:N",
        ...overrides,
    };
}

function makeSchema(overrides: Partial<TypeRegistry> = {}): TypeRegistry {
    return {
        nodeTypes: [makeNodeType()],
        linkTypes: [makeLinkType()],
        ...overrides,
    };
}

// --- 타입 정의 테스트 ---

describe("PropertyDef", () => {
    it("기본 속성 정의를 생성할 수 있다", () => {
        const prop: PropertyDef = {
            key: "hexCode",
            displayName: "HEX 색상 코드",
            valueType: "string",
            required: true,
        };
        expect(prop.key).toBe("hexCode");
        expect(prop.valueType).toBe("string");
        expect(prop.required).toBe(true);
    });

    it("enum 타입은 enumValues를 가질 수 있다", () => {
        const prop: PropertyDef = {
            key: "category",
            displayName: "분류",
            valueType: "enum",
            enumValues: ["primary", "secondary", "accent"],
        };
        expect(prop.enumValues).toEqual(["primary", "secondary", "accent"]);
    });

    it("description은 선택적이다", () => {
        const prop: PropertyDef = {
            key: "usage",
            displayName: "용도",
            valueType: "string",
        };
        expect(prop.description).toBeUndefined();
    });
});

describe("NodeType", () => {
    it("필수 필드로 생성할 수 있다", () => {
        const nt = makeNodeType();
        expect(nt.type).toBe("brand");
        expect(nt.displayName).toBe("브랜드");
        expect(nt.description).toBe("기업/제품 브랜드 엔티티");
        expect(nt.properties).toEqual([]);
    });

    it("visual 힌트를 가질 수 있다", () => {
        const nt = makeNodeType({
            visual: { color: "#6496ff", size: 36, icon: "building" },
        });
        expect(nt.visual?.color).toBe("#6496ff");
        expect(nt.visual?.size).toBe(36);
    });

    it("속성 정의 목록을 가질 수 있다", () => {
        const nt = makeNodeType({
            type: "color",
            properties: [
                { key: "hexCode", displayName: "HEX", valueType: "string", required: true },
                { key: "category", displayName: "분류", valueType: "enum", enumValues: ["primary", "secondary"] },
            ],
        });
        expect(nt.properties).toHaveLength(2);
        expect(nt.properties[0].required).toBe(true);
    });
});

describe("LinkType", () => {
    it("필수 필드로 생성할 수 있다", () => {
        const lt = makeLinkType();
        expect(lt.predicate).toBe("has-color");
        expect(lt.sourceTypes).toEqual(["brand"]);
        expect(lt.targetTypes).toEqual(["color"]);
        expect(lt.cardinality).toBe("1:N");
    });

    it("inverseDisplayName을 가질 수 있다", () => {
        const lt = makeLinkType({ inverseDisplayName: "~의 색상이다" });
        expect(lt.inverseDisplayName).toBe("~의 색상이다");
    });

    it("빈 sourceTypes는 모든 타입 허용을 의미한다", () => {
        const lt = makeLinkType({ sourceTypes: [], targetTypes: [] });
        expect(lt.sourceTypes).toEqual([]);
    });
});

describe("TypeRegistry", () => {
    it("nodeTypes와 linkTypes 배열로 구성된다", () => {
        const schema = makeSchema();
        expect(schema.nodeTypes).toHaveLength(1);
        expect(schema.linkTypes).toHaveLength(1);
    });
});

describe("Node 확장", () => {
    it("type은 필수이다", () => {
        const node: Node = { id: "n1", label: "Worxphere", type: "brand" };
        expect(node.type).toBe("brand");
    });

    it("props를 가질 수 있다", () => {
        const node: Node = {
            id: "n1",
            label: "#2E5BFF",
            type: "color",
            props: { hexCode: "#2E5BFF", category: "primary" },
        };
        expect(node.props?.hexCode).toBe("#2E5BFF");
    });

    it("props는 선택적이다", () => {
        const node: Node = { id: "n1", label: "브랜드", type: "brand" };
        expect(node.props).toBeUndefined();
    });
});

describe("Triple 확장", () => {
    it("metadata를 가질 수 있다", () => {
        const triple: Triple = {
            id: "t1",
            subject: "n1",
            predicate: "has-color",
            object: "n2",
            metadata: { confidence: 0.95, source: "manual" },
        };
        expect(triple.metadata?.confidence).toBe(0.95);
        expect(triple.metadata?.source).toBe("manual");
    });

    it("metadata는 선택적이다", () => {
        const triple: Triple = {
            id: "t1",
            subject: "n1",
            predicate: "has-color",
            object: "n2",
        };
        expect(triple.metadata).toBeUndefined();
    });
});

describe("KnowledgeGraph 확장", () => {
    it("schema 필드를 가질 수 있다", () => {
        const graph: KnowledgeGraph = {
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            schema: makeSchema(),
            nodes: [],
            triples: [],
            rules: [],
        };
        expect(graph.schema?.nodeTypes).toHaveLength(1);
        expect(graph.schema?.linkTypes).toHaveLength(1);
    });

    it("schema는 선택적이다 (하위 호환)", () => {
        const graph: KnowledgeGraph = {
            metadata: { name: "테스트", created: "2026-01-01", updated: "2026-01-01" },
            nodes: [],
            triples: [],
            rules: [],
        };
        expect(graph.schema).toBeUndefined();
    });

    it("schemaVersion을 metadata에 가질 수 있다", () => {
        const graph: KnowledgeGraph = {
            metadata: {
                name: "테스트",
                created: "2026-01-01",
                updated: "2026-01-01",
                schemaVersion: "2.0",
            },
            nodes: [],
            triples: [],
            rules: [],
        };
        expect(graph.metadata.schemaVersion).toBe("2.0");
    });
});
