import type { ReactNode } from "react";
import { SectionHeader } from "@/components/patterns/section-header";
import { Separator } from "@/components/ui/separator";

interface PanelSectionProps {
    title: string;
    count?: number;
    action?: ReactNode;
    empty?: string;
    children?: ReactNode;
    separator?: boolean;
}

export function PanelSection({
    title,
    count,
    action,
    empty,
    children,
    separator = true,
}: PanelSectionProps) {
    const isEmpty = !children && empty;

    return (
        <>
            {separator && <Separator />}
            <div className="space-y-2">
                <SectionHeader title={title} count={count} action={action} />
                {isEmpty ? (
                    <p className="text-muted-foreground text-xs">{empty}</p>
                ) : (
                    children
                )}
            </div>
        </>
    );
}
