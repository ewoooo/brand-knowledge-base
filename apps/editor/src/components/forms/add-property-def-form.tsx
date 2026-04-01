"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Label } from "@/components/ui/primitives/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/patterns/select";
import type { PropertyDef } from "@knowledgeview/kg-core";

const VALUE_TYPE_OPTIONS: { value: PropertyDef["valueType"]; label: string }[] = [
    { value: "string", label: "텍스트 (한 줄)" },
    { value: "text", label: "텍스트 (여러 줄)" },
    { value: "number", label: "숫자" },
    { value: "boolean", label: "예/아니오" },
    { value: "date", label: "날짜" },
    { value: "url", label: "URL" },
    { value: "enum", label: "선택 (enum)" },
    { value: "array", label: "배열" },
];

interface AddPropertyDefFormProps {
    onSubmit: (prop: PropertyDef) => void;
    onCancel: () => void;
    existingKeys: string[];
}

export function AddPropertyDefForm({
    onSubmit,
    onCancel,
    existingKeys,
}: AddPropertyDefFormProps) {
    const [key, setKey] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [valueType, setValueType] = useState<PropertyDef["valueType"]>("string");

    const trimmedKey = key.trim();
    const isDuplicate = existingKeys.includes(trimmedKey);
    const canSubmit = trimmedKey && displayName.trim() && !isDuplicate;

    return (
        <div className="border-border space-y-2 rounded-md border p-3">
            <p className="text-xs font-medium">새 속성 정의</p>
            <div className="space-y-1.5">
                <Label className="text-[11px]">키 (영문)</Label>
                <Input
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="예: hexCode"
                    className="h-7 text-xs"
                    autoFocus
                />
                {isDuplicate && (
                    <p className="text-destructive text-[11px]">이미 존재하는 키입니다</p>
                )}
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px]">표시 이름</Label>
                <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="예: HEX 코드"
                    className="h-7 text-xs"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px]">값 타입</Label>
                <Select
                    value={valueType}
                    onValueChange={(v) => setValueType(v as PropertyDef["valueType"])}
                >
                    <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {VALUE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-1.5 pt-1">
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onCancel}>
                    취소
                </Button>
                <Button
                    size="sm"
                    className="h-6 text-xs"
                    disabled={!canSubmit}
                    onClick={() =>
                        onSubmit({ key: trimmedKey, displayName: displayName.trim(), valueType })
                    }
                >
                    추가
                </Button>
            </div>
        </div>
    );
}
