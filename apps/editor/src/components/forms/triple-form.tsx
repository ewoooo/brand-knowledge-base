"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/patterns/dialog";
import { Input } from "@/components/ui/primitives/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/patterns/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/patterns/command";
import { Button } from "@/components/ui/primitives/button";
import { ArrowRight, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { commandFilter } from "@/lib/search-match";
import type { Node, LinkType } from "@knowledgeview/kg-core";

interface TripleFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (triple: {
        subject: string;
        predicate: string;
        object: string;
    }) => void;
    nodes: Node[];
    linkTypes?: LinkType[];
    initial?: { subject: string; predicate: string; object: string };
}

export function TripleForm({
    open,
    onClose,
    onSubmit,
    nodes,
    linkTypes,
    initial,
}: TripleFormProps) {
    const [subject, setSubject] = useState(initial?.subject ?? "");
    const [predicate, setPredicate] = useState(initial?.predicate ?? "");
    const [object, setObject] = useState(initial?.object ?? "");
    const [subjectOpen, setSubjectOpen] = useState(false);
    const [objectOpen, setObjectOpen] = useState(false);
    const [predicateOpen, setPredicateOpen] = useState(false);

    useEffect(() => {
        if (open) {
            setSubject(initial?.subject ?? "");
            setPredicate(initial?.predicate ?? "");
            setObject(initial?.object ?? "");
        }
    }, [open, initial]);

    const isEditing = !!initial;
    const canSubmit = subject.trim() && predicate.trim() && object.trim();

    // subject/object 노드 타입 기반으로 허용 predicate 필터링
    const filteredLinkTypes = useMemo(() => {
        if (!linkTypes?.length) return [];

        const subjectNode = nodes.find((n) => n.id === subject);
        const objectNode = nodes.find((n) => n.id === object);

        return linkTypes.filter((lt) => {
            const sourceOk =
                lt.sourceTypes.length === 0 ||
                !subjectNode ||
                lt.sourceTypes.includes(subjectNode.type);
            const targetOk =
                lt.targetTypes.length === 0 ||
                !objectNode ||
                lt.targetTypes.includes(objectNode.type);
            return sourceOk && targetOk;
        });
    }, [linkTypes, nodes, subject, object]);

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
                            <NodeCombobox
                                value={subject}
                                onChange={setSubject}
                                nodes={nodes}
                                open={subjectOpen}
                                onOpenChange={setSubjectOpen}
                                placeholder="주어 선택"
                            />
                        </div>

                        <div className="text-muted-foreground flex h-9 shrink-0 items-center">
                            <ArrowRight className="size-4" />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col items-end justify-end space-y-2">
                            <label className="pr-1 text-sm font-medium text-neutral-400">
                                목적어
                            </label>
                            <NodeCombobox
                                value={object}
                                onChange={setObject}
                                nodes={nodes}
                                open={objectOpen}
                                onOpenChange={setObjectOpen}
                                placeholder="목적어 선택"
                            />
                        </div>
                    </div>

                    {/* Predicate */}
                    <div className="flex flex-col space-y-2">
                        <label className="pl-1 text-sm font-medium text-neutral-400">
                            관계
                        </label>
                        {filteredLinkTypes.length > 0 ? (
                            <PredicateCombobox
                                value={predicate}
                                onChange={setPredicate}
                                linkTypes={filteredLinkTypes}
                                open={predicateOpen}
                                onOpenChange={setPredicateOpen}
                            />
                        ) : (
                            <Input
                                placeholder="관계 입력 (예: has-color, is-part-of)"
                                value={predicate}
                                onChange={(e) => setPredicate(e.target.value)}
                            />
                        )}
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

/* ------------------------------------------------------------------ */
/*  Node Combobox (Popover + Command)                                  */
/* ------------------------------------------------------------------ */

function NodeCombobox({
    value,
    onChange,
    nodes,
    open,
    onOpenChange,
    placeholder,
}: {
    value: string;
    onChange: (v: string) => void;
    nodes: Node[];
    open: boolean;
    onOpenChange: (v: boolean) => void;
    placeholder: string;
}) {
    const selected = nodes.find((n) => n.id === value);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {selected ? selected.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                    filter={(value, search) => {
                        const node = nodes.find((n) => n.id === value);
                        if (!node) return 0;
                        return commandFilter(
                            `${node.label} ${node.type}`,
                            search,
                        );
                    }}
                >
                    <CommandInput placeholder="노드 검색..." />
                    <CommandList>
                        <CommandEmpty>일치하는 노드가 없습니다</CommandEmpty>
                        <CommandGroup>
                            {nodes.map((node) => (
                                <CommandItem
                                    key={node.id}
                                    value={node.id}
                                    onSelect={(v) => {
                                        onChange(v === value ? "" : v);
                                        onOpenChange(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 size-4",
                                            value === node.id
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    />
                                    <span className="truncate text-sm">
                                        {node.label}
                                    </span>
                                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                                        {node.type}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

/* ------------------------------------------------------------------ */
/*  Predicate Combobox (Popover + Command)                             */
/* ------------------------------------------------------------------ */

function PredicateCombobox({
    value,
    onChange,
    linkTypes,
    open,
    onOpenChange,
}: {
    value: string;
    onChange: (v: string) => void;
    linkTypes: LinkType[];
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const selected = linkTypes.find((lt) => lt.predicate === value);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal"
                >
                    <span className="truncate">
                        {selected
                            ? selected.displayName
                            : "관계 선택"}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command
                    filter={(value, search) => {
                        const lt = linkTypes.find(
                            (l) => l.predicate === value,
                        );
                        if (!lt) return 0;
                        return commandFilter(
                            `${lt.displayName} ${lt.predicate}`,
                            search,
                        );
                    }}
                >
                    <CommandInput placeholder="관계 검색..." />
                    <CommandList>
                        <CommandEmpty>일치하는 관계가 없습니다</CommandEmpty>
                        <CommandGroup>
                            {linkTypes.map((lt) => (
                                <CommandItem
                                    key={lt.predicate}
                                    value={lt.predicate}
                                    onSelect={(v) => {
                                        onChange(v === value ? "" : v);
                                        onOpenChange(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 size-4",
                                            value === lt.predicate
                                                ? "opacity-100"
                                                : "opacity-0",
                                        )}
                                    />
                                    <div className="flex min-w-0 flex-col">
                                        <span className="truncate text-sm">
                                            {lt.displayName}
                                        </span>
                                        {lt.description && (
                                            <span className="text-muted-foreground truncate text-xs">
                                                {lt.description}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-muted-foreground ml-auto shrink-0 font-mono text-xs">
                                        {lt.predicate}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
