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
import { ArrowRight } from "lucide-react";
import type { Node } from "@knowledgeview/kg-core";

interface TripleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (triple: {
        subject: string;
        predicate: string;
        object: string;
    }) => void;
    nodes: Node[];
    initial?: { subject: string; predicate: string; object: string };
}

export function TripleForm({
    open,
    onClose,
    onSubmit,
    nodes,
    initial,
}: TripleFormProps) {
    const [subject, setSubject] = useState(initial?.subject ?? "");
    const [predicate, setPredicate] = useState(initial?.predicate ?? "");
    const [object, setObject] = useState(initial?.object ?? "");

    useEffect(() => {
        if (open) {
            setSubject(initial?.subject ?? "");
            setPredicate(initial?.predicate ?? "");
            setObject(initial?.object ?? "");
        }
    }, [open, initial]);

    const isEditing = !!initial;
    const canSubmit = subject.trim() && predicate.trim() && object.trim();

    function handleSubmit() {
        if (!canSubmit) return;
        onSubmit({
            subject: subject.trim(),
            predicate: predicate.trim(),
            object: object.trim(),
        });
        setSubject("");
        setPredicate("");
        setObject("");
        onClose();
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "관계 편집" : "새 관계 추가"}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    {/* Subject → Object (같은 행) */}
                    <div className="flex items-end gap-4">
                        <div className="flex min-w-0 flex-1 flex-col space-y-2">
                            <label className="pl-1 text-sm font-medium text-neutral-400">
                                주어
                            </label>
                            <Select value={subject} onValueChange={setSubject}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="노드 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {nodes.map((node) => (
                                        <SelectItem
                                            key={node.id}
                                            value={node.id}
                                        >
                                            {node.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="text-muted-foreground flex h-9 shrink-0 items-center">
                            <ArrowRight className="size-4" />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col items-end justify-end space-y-2">
                            <label className="pr-1 text-sm font-medium text-neutral-400">
                                목적어
                            </label>
                            <Select value={object} onValueChange={setObject}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="노드 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {nodes.map((node) => (
                                        <SelectItem
                                            key={node.id}
                                            value={node.id}
                                        >
                                            {node.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Predicate */}
                    <div className="flex flex-col space-y-2">
                        <label className="pl-1 text-sm font-medium text-neutral-400">
                            관계
                        </label>
                        <Input
                            placeholder="관계 입력 (예: hasColor, isPartOf)"
                            value={predicate}
                            onChange={(e) => setPredicate(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {isEditing ? "저장" : "추가"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
