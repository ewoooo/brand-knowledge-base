"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { PropertyDef, TypeRegistry } from "@knowledgeview/kg-core";
import { formatPropertyValue, isHexColor, parsePropertyInput } from "./property-format";

/* ------------------------------------------------------------------ */
/*  순수 헬퍼 (테스트 대상, named export)                                */
/* ------------------------------------------------------------------ */

export function getFieldsForType(
    schema: TypeRegistry | undefined,
    type: string,
): PropertyDef[] {
    if (!schema) return [];
    const nodeType = schema.nodeTypes.find((nt) => nt.type === type);
    return nodeType?.properties ?? [];
}

export function getDisplayFields(
    properties: PropertyDef[],
    values: Record<string, unknown> | undefined,
): PropertyDef[] {
    return properties.filter((prop) => {
        if (prop.required) return true;
        const val = values?.[prop.key];
        return val !== undefined && val !== null && val !== "";
    });
}

/* ------------------------------------------------------------------ */
/*  컴포넌트                                                            */
/* ------------------------------------------------------------------ */

interface PropertyEditorProps {
    properties: PropertyDef[];
    values: Record<string, unknown>;
    onChange?: (key: string, value: unknown) => void;
    readOnly?: boolean;
}

export function PropertyEditor({
    properties,
    values,
    onChange,
    readOnly = false,
}: PropertyEditorProps) {
    if (properties.length === 0) return null;

    if (readOnly) {
        const displayFields = getDisplayFields(properties, values);
        if (displayFields.length === 0) return null;

        return (
            <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                    속성
                </p>
                <div className="space-y-2">
                    {displayFields.map((prop) => (
                        <ReadOnlyField
                            key={prop.key}
                            prop={prop}
                            value={values[prop.key]}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase">
                속성
            </p>
            <div className="space-y-3">
                {properties.map((prop) => (
                    <EditField
                        key={prop.key}
                        prop={prop}
                        value={values[prop.key]}
                        onChange={(val) => onChange?.(prop.key, val)}
                    />
                ))}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  읽기 모드 필드                                                      */
/* ------------------------------------------------------------------ */

function ReadOnlyField({
    prop,
    value,
}: {
    prop: PropertyDef;
    value: unknown;
}) {
    const formatted = formatPropertyValue(prop.valueType, value);

    return (
        <div className="space-y-0.5">
            <p className="text-muted-foreground text-[11px]">
                {prop.displayName}
            </p>
            {prop.valueType === "url" && formatted ? (
                <a
                    href={formatted}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 truncate text-sm text-[#5e6ad2] hover:underline"
                    title={formatted}
                >
                    <span className="truncate">{formatted}</span>
                    <ExternalLink className="size-3 shrink-0" />
                </a>
            ) : prop.valueType === "enum" ? (
                <Badge variant="outline" className="text-xs font-normal">
                    {formatted}
                </Badge>
            ) : prop.valueType === "boolean" ? (
                <p className="text-sm">{formatted}</p>
            ) : (
                <div className="flex items-center gap-1.5">
                    {prop.valueType === "string" &&
                        typeof value === "string" &&
                        isHexColor(value) && (
                            <span
                                className="inline-block size-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: value }}
                            />
                        )}
                    <p
                        className={`truncate text-sm ${
                            prop.valueType === "number"
                                ? "font-mono tabular-nums"
                                : ""
                        } ${
                            prop.valueType === "string" &&
                            typeof value === "string" &&
                            isHexColor(value)
                                ? "font-mono text-xs"
                                : ""
                        }`}
                        title={formatted}
                    >
                        {formatted || (
                            <span className="text-muted-foreground">—</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  편집 모드 필드                                                      */
/* ------------------------------------------------------------------ */

function EditField({
    prop,
    value,
    onChange,
}: {
    prop: PropertyDef;
    value: unknown;
    onChange: (val: unknown) => void;
}) {
    const id = `prop-${prop.key}`;

    return (
        <div className="space-y-1">
            <Label htmlFor={id} className="text-xs">
                {prop.displayName}
                {prop.required && (
                    <span className="ml-0.5 text-destructive">*</span>
                )}
            </Label>
            {renderInput(prop, value, onChange, id)}
            {prop.description && (
                <p className="text-muted-foreground text-[11px]">
                    {prop.description}
                </p>
            )}
        </div>
    );
}

function renderInput(
    prop: PropertyDef,
    value: unknown,
    onChange: (val: unknown) => void,
    id: string,
) {
    switch (prop.valueType) {
        case "string":
            return (
                <Input
                    id={id}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={prop.displayName}
                />
            );

        case "number":
            return (
                <Input
                    id={id}
                    type="number"
                    value={value !== undefined && value !== null ? String(value) : ""}
                    onChange={(e) => onChange(parsePropertyInput("number", e.target.value))}
                    placeholder={prop.displayName}
                />
            );

        case "boolean":
            return (
                <div className="flex items-center gap-2 py-1">
                    <Switch
                        id={id}
                        checked={!!value}
                        onCheckedChange={(checked) => onChange(checked)}
                    />
                    <span className="text-muted-foreground text-xs">
                        {value ? "예" : "아니오"}
                    </span>
                </div>
            );

        case "date":
            return (
                <Input
                    id={id}
                    type="date"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            );

        case "url":
            return (
                <Input
                    id={id}
                    type="url"
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://..."
                />
            );

        case "enum":
            return (
                <Select
                    value={typeof value === "string" ? value : ""}
                    onValueChange={onChange}
                >
                    <SelectTrigger id={id}>
                        <SelectValue placeholder={`${prop.displayName} 선택`} />
                    </SelectTrigger>
                    <SelectContent>
                        {(prop.enumValues ?? []).map((v) => (
                            <SelectItem key={v} value={v}>
                                {v}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );

        default:
            return (
                <Input
                    id={id}
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
    }
}
