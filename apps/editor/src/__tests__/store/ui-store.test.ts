import { describe, test, expect, beforeEach } from "vitest";
import { useUIStore } from "@/store/ui-store";

describe("ui-store", () => {
  beforeEach(() => {
    useUIStore.setState(useUIStore.getInitialState(), true);
  });

  // --- Selection ---
  describe("selection", () => {
    test("초기 선택은 null", () => {
      expect(useUIStore.getState().selection).toBeNull();
    });

    test("selectNode는 노드를 선택", () => {
      useUIStore.getState().selectNode("n1");
      expect(useUIStore.getState().selection).toEqual({ type: "node", id: "n1" });
    });

    test("selectEdge는 엣지를 선택", () => {
      useUIStore.getState().selectEdge("t1");
      expect(useUIStore.getState().selection).toEqual({ type: "edge", id: "t1" });
    });

    test("clearSelection은 선택을 해제", () => {
      useUIStore.getState().selectNode("n1");
      useUIStore.getState().clearSelection();
      expect(useUIStore.getState().selection).toBeNull();
    });

    test("selectNode 후 selectEdge는 이전 선택을 대체 (단일 선택)", () => {
      useUIStore.getState().selectNode("n1");
      useUIStore.getState().selectEdge("t1");
      expect(useUIStore.getState().selection).toEqual({ type: "edge", id: "t1" });
    });
  });

  // --- Dialog ---
  describe("dialog", () => {
    test("초기 다이얼로그는 모두 닫힌 상태", () => {
      const state = useUIStore.getState();
      expect(state.nodeDialog.open).toBe(false);
      expect(state.tripleDialog.open).toBe(false);
      expect(state.ruleDialog.open).toBe(false);
    });

    test("openDialog(create)는 editingId null로 열림", () => {
      useUIStore.getState().openDialog("node");
      const { nodeDialog } = useUIStore.getState();
      expect(nodeDialog.open).toBe(true);
      expect(nodeDialog.editingId).toBeNull();
    });

    test("openDialog(edit)는 editingId가 설정됨", () => {
      useUIStore.getState().openDialog("triple", "t1");
      const { tripleDialog } = useUIStore.getState();
      expect(tripleDialog.open).toBe(true);
      expect(tripleDialog.editingId).toBe("t1");
    });

    test("closeDialog는 다이얼로그를 닫고 editingId를 초기화", () => {
      useUIStore.getState().openDialog("rule", "r1");
      useUIStore.getState().closeDialog("rule");
      const { ruleDialog } = useUIStore.getState();
      expect(ruleDialog.open).toBe(false);
      expect(ruleDialog.editingId).toBeNull();
    });

    test("다른 다이얼로그는 독립적으로 동작", () => {
      useUIStore.getState().openDialog("node", "n1");
      useUIStore.getState().openDialog("triple");
      expect(useUIStore.getState().nodeDialog.open).toBe(true);
      expect(useUIStore.getState().tripleDialog.open).toBe(true);
      expect(useUIStore.getState().ruleDialog.open).toBe(false);
    });
  });

  // --- Context Menu ---
  describe("contextMenu", () => {
    test("초기 컨텍스트 메뉴는 null", () => {
      expect(useUIStore.getState().contextMenu).toBeNull();
    });

    test("openContextMenu는 nodeId와 position을 설정", () => {
      useUIStore.getState().openContextMenu("n1", { x: 100, y: 200 });
      expect(useUIStore.getState().contextMenu).toEqual({
        nodeId: "n1",
        position: { x: 100, y: 200 },
      });
    });

    test("closeContextMenu는 null로 초기화", () => {
      useUIStore.getState().openContextMenu("n1", { x: 100, y: 200 });
      useUIStore.getState().closeContextMenu();
      expect(useUIStore.getState().contextMenu).toBeNull();
    });
  });

  // --- Search ---
  describe("search", () => {
    test("초기 검색은 닫힌 상태, 빈 쿼리", () => {
      const state = useUIStore.getState();
      expect(state.searchOpen).toBe(false);
      expect(state.searchQuery).toBe("");
    });

    test("openSearch는 검색을 열기", () => {
      useUIStore.getState().openSearch();
      expect(useUIStore.getState().searchOpen).toBe(true);
    });

    test("closeSearch는 검색을 닫고 쿼리 초기화", () => {
      useUIStore.getState().openSearch();
      useUIStore.getState().setSearchQuery("test");
      useUIStore.getState().closeSearch();
      expect(useUIStore.getState().searchOpen).toBe(false);
      expect(useUIStore.getState().searchQuery).toBe("");
    });

    test("setSearchQuery는 쿼리를 업데이트", () => {
      useUIStore.getState().setSearchQuery("node");
      expect(useUIStore.getState().searchQuery).toBe("node");
    });
  });

  // --- View ---
  describe("view", () => {
    test("초기 hiddenTypes는 빈 Set", () => {
      expect(useUIStore.getState().hiddenTypes).toEqual(new Set());
    });

    test("toggleHiddenType는 타입을 추가/제거 토글", () => {
      useUIStore.getState().toggleHiddenType("concept");
      expect(useUIStore.getState().hiddenTypes).toEqual(new Set(["concept"]));

      useUIStore.getState().toggleHiddenType("concept");
      expect(useUIStore.getState().hiddenTypes).toEqual(new Set());
    });

    test("초기 focusedNodeId는 null", () => {
      expect(useUIStore.getState().focusedNodeId).toBeNull();
    });

    test("setFocusedNodeId는 포커스 노드를 설정", () => {
      useUIStore.getState().setFocusedNodeId("n1");
      expect(useUIStore.getState().focusedNodeId).toBe("n1");

      useUIStore.getState().setFocusedNodeId(null);
      expect(useUIStore.getState().focusedNodeId).toBeNull();
    });
  });
});
