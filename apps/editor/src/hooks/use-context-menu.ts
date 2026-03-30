import { useState, useCallback } from "react";

interface ContextMenuState {
    nodeId: string;
    position: { x: number; y: number };
}

export function useContextMenu() {
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const openContextMenu = useCallback(
        (nodeId: string, position: { x: number; y: number }) => {
            setContextMenu({ nodeId, position });
        },
        [],
    );

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    return { contextMenu, openContextMenu, closeContextMenu };
}
