import type { PropertyDef } from "@knowledgeview/kg-core";

type ValueType = PropertyDef["valueType"];

export function isHexColor(value: string): boolean {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

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
        case "string":
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
        case "string":
        case "date":
        case "url":
        case "enum":
            return input;
        default:
            return input;
    }
}
