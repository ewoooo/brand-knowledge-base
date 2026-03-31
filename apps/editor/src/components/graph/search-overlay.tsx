"use client";

import { useRef, useEffect } from "react";
import { Input } from "@/components/ui/primitives/input";

interface SearchOverlayProps {
    open: boolean;
    query: string;
    matchedCount: number;
    onQueryChange: (query: string) => void;
    onClose: () => void;
}

export function SearchOverlay({
    open,
    query,
    matchedCount,
    onQueryChange,
    onClose,
}: SearchOverlayProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            // 약간의 지연 후 포커스 (DOM 렌더 이후)
            const timer = setTimeout(() => inputRef.current?.focus(), 0);
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!open) return null;

    return (
        <div className="absolute left-1/2 top-4 z-20 w-[320px] -translate-x-1/2">
            <div className="bg-background/90 rounded-lg border p-3 shadow-2xl backdrop-blur-sm">
                <Input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                    aria-label="노드 검색"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            onClose();
                        }
                    }}
                    placeholder="노드 검색..."
                    className="h-9 text-sm"
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {query.trim()
                            ? `${matchedCount}개 매칭`
                            : "라벨 또는 타입으로 검색"}
                    </span>
                    <span className="text-muted-foreground">
                        ⌘K 열기 · Esc 닫기
                    </span>
                </div>
            </div>
        </div>
    );
}
