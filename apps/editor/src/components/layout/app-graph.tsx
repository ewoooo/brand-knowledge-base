import type { ReactNode } from "react";

interface AppGraphProps {
    children: ReactNode;
}

export function AppGraph({ children }: AppGraphProps) {
    return (
        <div className="flex flex-1 flex-col">
            {children}
        </div>
    );
}
