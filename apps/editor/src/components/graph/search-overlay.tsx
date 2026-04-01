"use client";

import {
    CommandDialog,
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/patterns/command";
import { commandFilter } from "@/lib/search-match";
import type { Node } from "@knowledgeview/kg-core";

interface SearchOverlayProps {
    open: boolean;
    onClose: () => void;
    nodes: Node[];
    onSelectNode: (nodeId: string) => void;
    onQueryChange: (query: string) => void;
}

export function SearchOverlay({
    open,
    onClose,
    nodes,
    onSelectNode,
    onQueryChange,
}: SearchOverlayProps) {
    return (
        <CommandDialog
            open={open}
            onOpenChange={(v) => !v && onClose()}
            title="노드 검색"
            description="라벨 또는 타입으로 검색"
        >
            <Command filter={(value, search) => commandFilter(value, search)}>
                <CommandInput
                    placeholder="노드 검색..."
                    onValueChange={onQueryChange}
                />
                <CommandList>
                    <CommandEmpty>결과 없음</CommandEmpty>
                    <CommandGroup>
                        {nodes.map((node) => (
                            <CommandItem
                                key={node.id}
                                value={`${node.label} ${node.type}`}
                                onSelect={() => {
                                    onSelectNode(node.id);
                                    onClose();
                                }}
                            >
                                <span className="truncate">{node.label}</span>
                                {node.type && (
                                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                                        {node.type}
                                    </span>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
