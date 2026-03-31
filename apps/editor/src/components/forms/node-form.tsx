"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface NodeFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (node: { label: string; type: string }) => void;
    initial?: { label: string; type?: string };
    existingTypes?: string[];
}

const DEFAULT_TYPES = ["brand", "color", "typography", "concept"];

export function NodeForm({
    open,
    onClose,
    onSubmit,
    initial,
    existingTypes = [],
}: NodeFormProps) {
    const [label, setLabel] = useState(initial?.label ?? "");
    const [type, setType] = useState<string>(initial?.type ?? "");
    const [customType, setCustomType] = useState("");
    const [isCustom, setIsCustom] = useState(false);

    const allTypes = Array.from(
        new Set([...DEFAULT_TYPES, ...existingTypes]),
    ).sort();

    useEffect(() => {
        if (open) {
            setLabel(initial?.label ?? "");
            const initialType = initial?.type ?? "";
            if (
                initialType &&
                !DEFAULT_TYPES.includes(initialType) &&
                !existingTypes.includes(initialType)
            ) {
                setIsCustom(true);
                setCustomType(initialType);
                setType("");
            } else {
                setIsCustom(false);
                setCustomType("");
                setType(initialType);
            }
        }
    }, [open, initial, existingTypes]);

    const isEditing = !!initial;

    function handleSubmit() {
        if (!label.trim()) return;
        const finalType = isCustom ? customType.trim() : type;
        if (!finalType) return;
        onSubmit({ label: label.trim(), type: finalType });
        setLabel("");
        setType("");
        setCustomType("");
        setIsCustom(false);
        onClose();
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "노드 편집" : "새 노드 추가"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">레이블</label>
                        <Input
                            placeholder="노드 이름 입력"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium">타입</label>
                        {isCustom ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="새 타입 이름 입력"
                                    value={customType}
                                    onChange={(e) =>
                                        setCustomType(e.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsCustom(false);
                                        setCustomType("");
                                    }}
                                >
                                    취소
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="타입 선택 (선택사항)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allTypes.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setIsCustom(true);
                                        setType("");
                                    }}
                                >
                                    + 새 타입
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={!label.trim() || !(isCustom ? customType.trim() : type)}>
                        {isEditing ? "저장" : "추가"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
