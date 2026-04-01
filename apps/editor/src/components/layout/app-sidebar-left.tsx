import type { ComponentProps } from "react";
import { Sidebar } from "@/components/blocks/left-sidebar";

type LeftSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebarLeft(props: LeftSidebarProps) {
    return (
        <aside className="w-[220px] min-w-[220px] border-r">
            <Sidebar {...props} />
        </aside>
    );
}
