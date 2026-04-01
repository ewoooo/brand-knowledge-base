import type { ValidationResult } from "@knowledgeview/kg-core";

interface RuleCardProps {
    result: ValidationResult;
}

export function RuleCard({ result }: RuleCardProps) {
    const isPassing = result.status === "pass";

    return (
        <div className="border-border mb-1.5 border-b px-3 py-2 text-xs last:border-b-0">
            <div
                className="flex items-center gap-1.5 truncate font-medium"
                title={result.ruleName}
            >
                <span
                    className={`size-1.5 shrink-0 rounded-full ${
                        isPassing ? "bg-[#4da375]" : "bg-[#d94f4f]"
                    }`}
                />
                {result.ruleName}
            </div>
            <div className="text-muted-foreground truncate pl-3">
                {isPassing
                    ? "통과"
                    : `${result.violations.length}건 위반`}
            </div>
        </div>
    );
}
