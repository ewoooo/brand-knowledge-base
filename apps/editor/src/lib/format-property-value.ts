import type { PropertyDef } from "@knowledgeview/kg-core";

type ValueType = PropertyDef["valueType"];

export function formatPropertyValue(
    valueType: ValueType,
    value: unknown,
): string {
    if (value === null || value === undefined) return "";

    switch (valueType) {
        case "boolean":
            return value ? "예" : "아니오";
        case "number":
            return String(value);
        case "array":
            return Array.isArray(value) ? value.join(", ") : String(value);
        case "string":
        case "text":
        case "date":
        case "url":
        case "enum":
            return String(value);
        default:
            return String(value);
    }
}

export function parsePropertyInput(
    valueType: ValueType,
    input: string,
): unknown {
    switch (valueType) {
        case "number": {
            if (input === "") return undefined;
            const n = Number(input);
            return Number.isNaN(n) ? undefined : n;
        }
        case "boolean":
            return input === "true";
        case "text":
        case "string":
        case "date":
        case "url":
        case "enum":
            return input;
        case "array":
            return input
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        default:
            return input;
    }
}
