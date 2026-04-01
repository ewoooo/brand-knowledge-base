import type { ReactNode } from "react";
import { CountBadge } from "@/components/blocks/count-badge";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    title: string;
    count?: number;
    action?: ReactNode;
    className?: string;
}

export function SectionHeader({ title, count, action, className }: SectionHeaderProps) {
    return (
        <div className={cn("mb-2 flex items-center justify-between", className)}>
            <div className="flex flex-1 items-center gap-1.5">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                    {title}
                </span>
                {count !== undefined && <CountBadge count={count} />}
            </div>
            {action}
        </div>
    );
}
