"use client";

import { useState } from "react";

interface Selection {
    type: "node" | "edge";
    id: string;
}

export function useSelection() {
    const [selection, setSelection] = useState<Selection | null>(null);

    const selectNode = (id: string) => setSelection({ type: "node", id });
    const selectEdge = (id: string) => setSelection({ type: "edge", id });
    const clearSelection = () => setSelection(null);

    return { selection, selectNode, selectEdge, clearSelection };
}
