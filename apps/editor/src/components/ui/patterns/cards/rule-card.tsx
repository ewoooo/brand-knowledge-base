import type { ValidationResult } from "@knowledgeview/kg-core";
import { Button } from "@/components/ui/primitives/button";
import { Pencil, X } from "lucide-react";

interface RuleCardProps {
    result: ValidationResult;
    onEdit: (ruleId: string) => void;
    onDelete: (ruleId: string) => void;
}

export function RuleCard({ result, onEdit, onDelete }: RuleCardProps) {
    const isPassing = result.status === "pass";

    return (
        <div className="group border-border mb-1.5 border-b px-3 py-2 text-xs last:border-b-0">
            <div
                className="flex items-center gap-1.5 font-medium"
                title={result.ruleName}
            >
                <span
                    className={`size-1.5 shrink-0 rounded-full ${
                        isPassing ? "bg-[#4da375]" : "bg-[#d94f4f]"
                    }`}
                />
                <span className="truncate">{result.ruleName}</span>
                <span className="ml-auto hidden shrink-0 gap-0.5 group-hover:flex">
                    <Button
                        variant="ghost"
                        size="xs"
                        className="h-5 w-5 p-0"
                        onClick={() => onEdit(result.ruleId)}
                        title="편집"
                    >
                        <Pencil className="size-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="xs"
                        className="text-destructive h-5 w-5 p-0"
                        onClick={() => onDelete(result.ruleId)}
                        title="삭제"
                    >
                        <X className="size-3" />
                    </Button>
                </span>
            </div>
            <div className="text-muted-foreground truncate pl-3">
                {isPassing
                    ? "통과"
                    : `${result.violations.length}건 위반`}
            </div>
        </div>
    );
}
