import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface Selection {
  type: "node" | "edge";
  id: string;
}

export interface DialogState {
  open: boolean;
  editingId: string | null;
}

interface ContextMenuState {
  nodeId: string;
  position: { x: number; y: number };
}

type DialogKind = "node" | "triple" | "rule";

export interface UIState {
  // Selection
  selection: Selection | null;
  selectNode: (id: string) => void;
  selectEdge: (id: string) => void;
  clearSelection: () => void;

  // Dialogs
  nodeDialog: DialogState;
  tripleDialog: DialogState;
  ruleDialog: DialogState;
  openDialog: (kind: DialogKind, editingId?: string) => void;
  closeDialog: (kind: DialogKind) => void;

  // Context Menu
  contextMenu: ContextMenuState | null;
  openContextMenu: (
    nodeId: string,
    position: { x: number; y: number },
  ) => void;
  closeContextMenu: () => void;

  // Search
  searchOpen: boolean;
  searchQuery: string;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;

  // View
  hiddenTypes: Set<string>;
  toggleHiddenType: (type: string) => void;
  focusedNodeId: string | null;
  setFocusedNodeId: (id: string | null) => void;
}

const initialDialog: DialogState = { open: false, editingId: null };

function dialogKey(kind: DialogKind): keyof Pick<UIState, "nodeDialog" | "tripleDialog" | "ruleDialog"> {
  return `${kind}Dialog`;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Selection
      selection: null,
      selectNode: (id) =>
        set({ selection: { type: "node", id } }, undefined, "ui/selectNode"),
      selectEdge: (id) =>
        set({ selection: { type: "edge", id } }, undefined, "ui/selectEdge"),
      clearSelection: () =>
        set({ selection: null }, undefined, "ui/clearSelection"),

      // Dialogs
      nodeDialog: { ...initialDialog },
      tripleDialog: { ...initialDialog },
      ruleDialog: { ...initialDialog },
      openDialog: (kind, editingId) =>
        set(
          { [dialogKey(kind)]: { open: true, editingId: editingId ?? null } },
          undefined,
          `ui/openDialog:${kind}`,
        ),
      closeDialog: (kind) =>
        set(
          { [dialogKey(kind)]: { open: false, editingId: null } },
          undefined,
          `ui/closeDialog:${kind}`,
        ),

      // Context Menu
      contextMenu: null,
      openContextMenu: (nodeId, position) =>
        set(
          { contextMenu: { nodeId, position } },
          undefined,
          "ui/openContextMenu",
        ),
      closeContextMenu: () =>
        set({ contextMenu: null }, undefined, "ui/closeContextMenu"),

      // Search
      searchOpen: false,
      searchQuery: "",
      openSearch: () =>
        set({ searchOpen: true }, undefined, "ui/openSearch"),
      closeSearch: () =>
        set(
          { searchOpen: false, searchQuery: "" },
          undefined,
          "ui/closeSearch",
        ),
      setSearchQuery: (query) =>
        set({ searchQuery: query }, undefined, "ui/setSearchQuery"),

      // View
      hiddenTypes: new Set<string>(),
      toggleHiddenType: (type) =>
        set(
          (state) => {
            const next = new Set(state.hiddenTypes);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            return { hiddenTypes: next };
          },
          undefined,
          "ui/toggleHiddenType",
        ),
      focusedNodeId: null,
      setFocusedNodeId: (id) =>
        set({ focusedNodeId: id }, undefined, "ui/setFocusedNodeId"),
    }),
    { name: "ui-store" },
  ),
);
