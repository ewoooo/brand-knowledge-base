import type { ComponentProps } from "react";
import { DetailPanel } from "@/components/blocks/detail-panel";

type RightSidebarProps = ComponentProps<typeof DetailPanel>;

export function RightSidebar(props: RightSidebarProps) {
    return (
        <aside className="w-[350px] min-w-[350px] border-l">
            <DetailPanel {...props} />
        </aside>
    );
}
