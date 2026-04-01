interface GraphInfoProps {
    nodeCount: number;
    tripleCount: number;
    ruleCount: number;
}

export function GraphInfo({ nodeCount, tripleCount, ruleCount }: GraphInfoProps) {
    return (
        <span className="text-muted-foreground text-xs">
            노드 {nodeCount} · 관계 {tripleCount} · 규칙 {ruleCount}
        </span>
    );
}
