import { useState, useMemo, useCallback, useEffect } from "react";
import type { Node } from "@knowledgeview/kg-core";
import { findMatchingNodeIds } from "@/lib/search-match";

interface UseSearchOptions {
    onOpen?: () => void;
}

export function useSearch(nodes: Node[] | null, options?: UseSearchOptions) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const matchedNodeIds = useMemo(
        () => (nodes ? findMatchingNodeIds(nodes, searchQuery) : null),
        [nodes, searchQuery],
    );

    const highlightedNodeIds = searchOpen ? matchedNodeIds : null;

    const openSearch = useCallback(() => {
        setSearchOpen(true);
    }, []);

    const closeSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery("");
    }, []);

    // Global keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen(true);
                options?.onOpen?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [options?.onOpen]);

    return {
        searchOpen,
        searchQuery,
        setSearchQuery,
        highlightedNodeIds,
        matchedCount: highlightedNodeIds?.size ?? 0,
        openSearch,
        closeSearch,
    };
}
