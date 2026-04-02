import { describe, test, expect, beforeEach, vi } from "vitest";
import { createEmptyGraph } from "@knowledgeview/kg-core";
import type { KnowledgeGraph } from "@knowledgeview/kg-core";
import { useGraphStore } from "@/store/graph-store";

function seedGraph(): KnowledgeGraph {
  const g = createEmptyGraph("test-graph");
  return {
    ...g,
    nodes: [
      { id: "n1", label: "Node A", type: "concept" },
      { id: "n2", label: "Node B", type: "person" },
    ],
    triples: [
      { id: "t1", subject: "n1", predicate: "related-to", object: "n2" },
    ],
    rules: [],
  };
}

describe("graph-store", () => {
  beforeEach(() => {
    useGraphStore.setState(useGraphStore.getInitialState(), true);
  });

  // --- 초기 상태 ---
  test("초기 상태는 null graph, null filename, isDirty false", () => {
    const { graph, filename, isDirty } = useGraphStore.getState();
    expect(graph).toBeNull();
    expect(filename).toBeNull();
    expect(isDirty).toBe(false);
  });

  // --- modify ---
  test("modify는 graph를 변환하고 isDirty를 true로 설정", () => {
    useGraphStore.setState({ graph: seedGraph() });
    const { modify } = useGraphStore.getState();

    modify((g) => ({ ...g, nodes: [...g.nodes, { id: "n3", label: "New", type: "test" }] }));

    const { graph, isDirty } = useGraphStore.getState();
    expect(graph!.nodes).toHaveLength(3);
    expect(isDirty).toBe(true);
  });

  test("modify는 graph가 null이면 무시", () => {
    const { modify } = useGraphStore.getState();
    modify((g) => ({ ...g, nodes: [] }));

    expect(useGraphStore.getState().graph).toBeNull();
    expect(useGraphStore.getState().isDirty).toBe(false);
  });

  // --- Node CRUD ---
  test("addNode는 노드를 추가하고 ID를 자동 생성", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().addNode({ label: "New Node", type: "concept" });

    const { graph } = useGraphStore.getState();
    expect(graph!.nodes).toHaveLength(3);
    const added = graph!.nodes.find((n) => n.label === "New Node");
    expect(added).toBeDefined();
    expect(added!.id).toBeTruthy();
    expect(added!.id).not.toBe("n1");
    expect(added!.id).not.toBe("n2");
  });

  test("removeNode는 노드와 연관 트리플을 제거", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().removeNode("n1");

    const { graph } = useGraphStore.getState();
    expect(graph!.nodes).toHaveLength(1);
    expect(graph!.nodes[0].id).toBe("n2");
    expect(graph!.triples).toHaveLength(0);
  });

  test("updateNode는 노드 필드를 업데이트", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().updateNode("n1", { label: "Updated" });

    const node = useGraphStore.getState().graph!.nodes.find((n) => n.id === "n1");
    expect(node!.label).toBe("Updated");
  });

  // --- Triple CRUD ---
  test("addTriple은 트리플을 추가하고 ID를 자동 생성", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().addTriple({ subject: "n2", predicate: "knows", object: "n1" });

    const { graph } = useGraphStore.getState();
    expect(graph!.triples).toHaveLength(2);
    const added = graph!.triples.find((t) => t.predicate === "knows");
    expect(added).toBeDefined();
    expect(added!.id).toBeTruthy();
  });

  test("removeTriple은 트리플을 제거", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().removeTriple("t1");

    expect(useGraphStore.getState().graph!.triples).toHaveLength(0);
  });

  test("updateTriple은 트리플 필드를 업데이트", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().updateTriple("t1", { predicate: "depends-on" });

    const triple = useGraphStore.getState().graph!.triples.find((t) => t.id === "t1");
    expect(triple!.predicate).toBe("depends-on");
  });

  // --- Rule CRUD ---
  test("addRule은 규칙을 추가하고 ID를 자동 생성", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().addRule({
      name: "Test Rule",
      expression: "test",
      type: "constraint",
      condition: { nodeType: "concept", predicate: "related-to", operator: "must_have" },
    });

    const { graph } = useGraphStore.getState();
    expect(graph!.rules).toHaveLength(1);
    expect(graph!.rules[0].name).toBe("Test Rule");
    expect(graph!.rules[0].id).toBeTruthy();
  });

  test("removeRule은 규칙을 제거", () => {
    const g = seedGraph();
    g.rules = [{ id: "r1", name: "Rule", expression: "x", type: "constraint", condition: { nodeType: "concept", predicate: "p", operator: "must_have" } }];
    useGraphStore.setState({ graph: g });
    useGraphStore.getState().removeRule("r1");

    expect(useGraphStore.getState().graph!.rules).toHaveLength(0);
  });

  test("updateRule은 규칙 필드를 업데이트", () => {
    const g = seedGraph();
    g.rules = [{ id: "r1", name: "Rule", expression: "x", type: "constraint", condition: { nodeType: "concept", predicate: "p", operator: "must_have" } }];
    useGraphStore.setState({ graph: g });
    useGraphStore.getState().updateRule("r1", { name: "Updated Rule" });

    expect(useGraphStore.getState().graph!.rules[0].name).toBe("Updated Rule");
  });

  // --- SystemPrompt ---
  test("updateSystemPrompt는 메타데이터를 업데이트", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().updateSystemPrompt("You are a helpful assistant");

    const { graph } = useGraphStore.getState();
    expect(graph!.metadata.systemPrompt).toBe("You are a helpful assistant");
  });

  test("updateSystemPrompt에 빈 문자열이면 undefined로 설정", () => {
    useGraphStore.setState({ graph: seedGraph() });
    useGraphStore.getState().updateSystemPrompt("");

    const { graph } = useGraphStore.getState();
    expect(graph!.metadata.systemPrompt).toBeUndefined();
  });

  // --- PropertyDef CRUD ---
  test("addPropertyDef는 스키마에 속성 정의를 추가", () => {
    const g = seedGraph();
    g.schema = {
      nodeTypes: [{ type: "concept", displayName: "Concept", description: "", properties: [] }],
      linkTypes: [],
    };
    useGraphStore.setState({ graph: g });

    useGraphStore.getState().addPropertyDef("concept", {
      key: "color",
      displayName: "Color",
      valueType: "string",
    });

    const nodeType = useGraphStore.getState().graph!.schema!.nodeTypes.find((t) => t.type === "concept");
    expect(nodeType!.properties).toHaveLength(1);
    expect(nodeType!.properties[0].key).toBe("color");
  });

  test("removePropertyDef는 속성 정의를 제거", () => {
    const g = seedGraph();
    g.schema = {
      nodeTypes: [{ type: "concept", displayName: "Concept", description: "", properties: [{ key: "color", displayName: "Color", valueType: "string" }] }],
      linkTypes: [],
    };
    useGraphStore.setState({ graph: g });

    useGraphStore.getState().removePropertyDef("concept", "color");

    const nodeType = useGraphStore.getState().graph!.schema!.nodeTypes.find((t) => t.type === "concept");
    expect(nodeType!.properties).toHaveLength(0);
  });

  test("updatePropertyDef는 속성 정의를 업데이트", () => {
    const g = seedGraph();
    g.schema = {
      nodeTypes: [{ type: "concept", displayName: "Concept", description: "", properties: [{ key: "color", displayName: "Color", valueType: "string" }] }],
      linkTypes: [],
    };
    useGraphStore.setState({ graph: g });

    useGraphStore.getState().updatePropertyDef("concept", "color", { displayName: "색상" });

    const nodeType = useGraphStore.getState().graph!.schema!.nodeTypes.find((t) => t.type === "concept");
    expect(nodeType!.properties[0].displayName).toBe("색상");
  });

  // --- load ---
  test("load는 API에서 그래프를 가져와 상태를 설정", async () => {
    const mockGraph = seedGraph();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGraph),
    });

    await useGraphStore.getState().load("test-file");

    const { graph, filename, isDirty } = useGraphStore.getState();
    expect(graph).toEqual(mockGraph);
    expect(filename).toBe("test-file");
    expect(isDirty).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/graphs/test-file");
  });

  test("load 실패 시 에러를 throw", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false });

    await expect(useGraphStore.getState().load("bad-file")).rejects.toThrow("Failed to load graph");
  });

  // --- save ---
  test("save는 현재 그래프를 API에 저장하고 isDirty를 false로", async () => {
    const g = seedGraph();
    useGraphStore.setState({ graph: g, filename: "my-file", isDirty: true });

    global.fetch = vi.fn().mockResolvedValue({ ok: true });

    await useGraphStore.getState().save();

    expect(useGraphStore.getState().isDirty).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/graphs/my-file", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(g),
    });
  });

  test("save는 graph이나 filename이 없으면 무시", async () => {
    global.fetch = vi.fn();
    await useGraphStore.getState().save();
    expect(fetch).not.toHaveBeenCalled();
  });

  // --- CRUD 후 isDirty ---
  test("모든 CRUD 작업 후 isDirty가 true", () => {
    useGraphStore.setState({ graph: seedGraph(), isDirty: false });

    useGraphStore.getState().addNode({ label: "X", type: "test" });
    expect(useGraphStore.getState().isDirty).toBe(true);
  });
});
