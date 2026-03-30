"use client";

import { useState, useCallback } from "react";

interface Selection {
    type: "node" | "edge";
    id: string;
}

export function useSelection() {
    const [selection, setSelection] = useState<Selection | null>(null);

    const selectNode = useCallback((id: string) => {
        setSelection({ type: "node", id });
    }, []);

    const selectEdge = useCallback((id: string) => {
        setSelection({ type: "edge", id });
    }, []);

    const clearSelection = useCallback(() => {
        setSelection(null);
    }, []);

    return {
        selection,
        selectNode,
        selectEdge,
        clearSelection,
    };
}
