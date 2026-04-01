import { cn } from "@/lib/utils";

interface CountBadgeProps {
    count: number;
    className?: string;
}

export function CountBadge({ count, className }: CountBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground",
                className,
            )}
        >
            {count}
        </span>
    );
}
