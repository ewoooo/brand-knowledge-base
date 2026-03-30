"use client";

interface NodeContextMenuProps {
  nodeId: string;
  nodeLabel: string;
  position: { x: number; y: number };
  onClose: () => void;
  onAddRelation: (subjectId: string) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export function NodeContextMenu({
  nodeId,
  nodeLabel,
  position,
  onClose,
  onAddRelation,
  onEditNode,
  onDeleteNode,
}: NodeContextMenuProps) {
  return (
    <>
      {/* Backdrop to close on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Menu */}
      <div
        className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
        style={{ left: position.x, top: position.y }}
      >
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          {nodeLabel}
        </div>
        <div className="-mx-1 my-1 h-px bg-border" />
        <button
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            onAddRelation(nodeId);
            onClose();
          }}
        >
          + 관계 추가
        </button>
        <button
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            onEditNode(nodeId);
            onClose();
          }}
        >
          노드 편집
        </button>
        <div className="-mx-1 my-1 h-px bg-border" />
        <button
          className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm text-red-400 outline-none hover:bg-red-500/10"
          onClick={() => {
            onDeleteNode(nodeId);
            onClose();
          }}
        >
          노드 삭제
        </button>
      </div>
    </>
  );
}
