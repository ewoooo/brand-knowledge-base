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
                className="bg-popover text-popover-foreground animate-in fade-in-0 zoom-in-95 fixed z-50 min-w-[160px] overflow-hidden rounded-md border p-1 shadow-md"
                style={{ left: position.x, top: position.y }}
            >
                <div className="text-muted-foreground px-2 py-1.5 text-xs font-semibold">
                    {nodeLabel}
                </div>
                <div className="bg-border -mx-1 my-1 h-px" />
                <button
                    className="hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                    onClick={() => {
                        onAddRelation(nodeId);
                        onClose();
                    }}
                >
                    + 관계 추가
                </button>
                <button
                    className="hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none"
                    onClick={() => {
                        onEditNode(nodeId);
                        onClose();
                    }}
                >
                    노드 편집
                </button>
                <div className="bg-border -mx-1 my-1 h-px" />
                <button
                    className="relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-red-400 outline-none select-none hover:bg-red-500/10"
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
