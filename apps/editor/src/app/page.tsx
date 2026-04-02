"use client";

import { useEffect } from "react";
import { AppSidebarLeft } from "@/components/layout/app-sidebar-left";
import { AppSidebarRight } from "@/components/layout/app-sidebar-right";
import { AppGraph } from "@/components/layout/app-graph";
import { Dialogs } from "@/components/blocks/dialogs";
import { useGraphStore } from "@/store/graph-store";
import { setupValidationSubscription } from "@/store/validation-store";

export default function Home() {
    const graph = useGraphStore((s) => s.graph);

    useEffect(() => {
        const unsub = setupValidationSubscription();
        return unsub;
    }, []);

    if (!graph) {
        return (
            <div className="flex h-screen">
                <AppSidebarLeft />
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-muted-foreground">
                        좌측에서 그래프를 선택하거나 새로 만드세요
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <AppSidebarLeft />
            <AppGraph />
            <AppSidebarRight />
            <Dialogs />
        </div>
    );
}
