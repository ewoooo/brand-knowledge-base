import { describe, it, expect } from "vitest";
import {
    formatPropertyValue,
    parsePropertyInput,
    isHexColor,
} from "@/components/forms/property-format";

describe("isHexColor", () => {
    it("유효한 6자리 hex 인식", () => {
        expect(isHexColor("#2E5BFF")).toBe(true);
        expect(isHexColor("#ff5733")).toBe(true);
    });

    it("유효한 3자리 hex 인식", () => {
        expect(isHexColor("#fff")).toBe(true);
        expect(isHexColor("#F00")).toBe(true);
    });

    it("# 없으면 false", () => {
        expect(isHexColor("2E5BFF")).toBe(false);
    });

    it("일반 문자열은 false", () => {
        expect(isHexColor("hello")).toBe(false);
        expect(isHexColor("")).toBe(false);
    });
});

describe("formatPropertyValue", () => {
    it("string 값은 그대로 반환", () => {
        expect(formatPropertyValue("string", "hello")).toBe("hello");
    });

    it("number 값은 문자열로 변환", () => {
        expect(formatPropertyValue("number", 42)).toBe("42");
        expect(formatPropertyValue("number", 3.14)).toBe("3.14");
    });

    it("boolean true는 '예'", () => {
        expect(formatPropertyValue("boolean", true)).toBe("예");
    });

    it("boolean false는 '아니오'", () => {
        expect(formatPropertyValue("boolean", false)).toBe("아니오");
    });

    it("date 값은 그대로 반환", () => {
        expect(formatPropertyValue("date", "2026-03-31")).toBe("2026-03-31");
    });

    it("url 값은 그대로 반환", () => {
        expect(formatPropertyValue("url", "https://example.com")).toBe("https://example.com");
    });

    it("enum 값은 그대로 반환", () => {
        expect(formatPropertyValue("enum", "primary")).toBe("primary");
    });

    it("null/undefined는 빈 문자열", () => {
        expect(formatPropertyValue("string", null)).toBe("");
        expect(formatPropertyValue("string", undefined)).toBe("");
    });
});

describe("parsePropertyInput", () => {
    it("string은 그대로", () => {
        expect(parsePropertyInput("string", "hello")).toBe("hello");
    });

    it("number는 숫자로 변환", () => {
        expect(parsePropertyInput("number", "42")).toBe(42);
        expect(parsePropertyInput("number", "3.14")).toBe(3.14);
    });

    it("number 빈 문자열은 undefined", () => {
        expect(parsePropertyInput("number", "")).toBeUndefined();
    });

    it("number 유효하지 않은 값은 undefined", () => {
        expect(parsePropertyInput("number", "abc")).toBeUndefined();
    });

    it("boolean 'true'/'false' 변환", () => {
        expect(parsePropertyInput("boolean", "true")).toBe(true);
        expect(parsePropertyInput("boolean", "false")).toBe(false);
    });

    it("date는 그대로", () => {
        expect(parsePropertyInput("date", "2026-03-31")).toBe("2026-03-31");
    });

    it("url은 그대로", () => {
        expect(parsePropertyInput("url", "https://example.com")).toBe("https://example.com");
    });

    it("enum은 그대로", () => {
        expect(parsePropertyInput("enum", "primary")).toBe("primary");
    });
});
