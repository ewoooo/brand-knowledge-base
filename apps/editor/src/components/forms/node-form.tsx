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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyEditor, getFieldsForType } from "./property-editor";
import type { TypeRegistry } from "@knowledgeview/kg-core";

interface NodeFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (node: { label: string; type: string; props?: Record<string, unknown> }) => void;
    initial?: { label: string; type?: string; props?: Record<string, unknown> };
    existingTypes?: string[];
    schema?: TypeRegistry;
}

const DEFAULT_TYPES = ["brand", "color", "typography", "concept"];

export function NodeForm({
    open,
    onClose,
    onSubmit,
    initial,
    existingTypes = [],
    schema,
}: NodeFormProps) {
    const [label, setLabel] = useState(initial?.label ?? "");
    const [type, setType] = useState<string>(initial?.type ?? "");
    const [customType, setCustomType] = useState("");
    const [isCustom, setIsCustom] = useState(false);
    const [props, setProps] = useState<Record<string, unknown>>(initial?.props ?? {});

    const hasSchema = !!schema;
    const typeOptions = hasSchema
        ? schema.nodeTypes.map((nt) => ({ value: nt.type, label: nt.displayName }))
        : Array.from(new Set([...DEFAULT_TYPES, ...existingTypes]))
              .sort()
              .map((t) => ({ value: t, label: t }));

    const currentType = isCustom ? customType.trim() : type;
    const propertyDefs = getFieldsForType(schema, currentType);

    useEffect(() => {
        if (open) {
            setLabel(initial?.label ?? "");
            setProps(initial?.props ?? {});
            const initialType = initial?.type ?? "";
            if (hasSchema) {
                setIsCustom(false);
                setCustomType("");
                setType(initialType);
            } else {
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
        }
    }, [open, initial, existingTypes, hasSchema]);

    function handleTypeChange(newType: string) {
        setType(newType);
        setProps({});
    }

    function handlePropChange(key: string, value: unknown) {
        setProps((prev) => ({ ...prev, [key]: value }));
    }

    const isEditing = !!initial;

    function handleSubmit() {
        if (!label.trim()) return;
        const finalType = isCustom ? customType.trim() : type;
        if (!finalType) return;
        const hasProps = Object.keys(props).length > 0;
        onSubmit({
            label: label.trim(),
            type: finalType,
            ...(hasProps ? { props } : {}),
        });
        setLabel("");
        setType("");
        setCustomType("");
        setIsCustom(false);
        setProps({});
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

                <ScrollArea className="max-h-[60vh]">
                    <div className="flex flex-col gap-4 py-2 pr-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="node-label" className="text-sm font-medium">레이블</Label>
                            <Input
                                id="node-label"
                                placeholder="노드 이름 입력"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium">타입</Label>
                            {!hasSchema && isCustom ? (
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="새 타입 이름 입력"
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        onKeyDown={handleKeyDown}
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
                                    <Select value={type} onValueChange={handleTypeChange}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="타입 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    <span className="truncate" title={opt.label}>{opt.label}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {!hasSchema && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setIsCustom(true);
                                                setType("");
                                                setProps({});
                                            }}
                                        >
                                            + 새 타입
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {propertyDefs.length > 0 && (
                            <PropertyEditor
                                properties={propertyDefs}
                                values={props}
                                onChange={handlePropChange}
                            />
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!label.trim() || !(isCustom ? customType.trim() : type)}
                    >
                        {isEditing ? "저장" : "추가"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
