import { describe, it, expect } from "vitest";
import { normalizeType } from "../normalize-type";

describe("normalizeType", () => {
  it("PascalCase → kebab-case", () => {
    expect(normalizeType("BrandName")).toBe("brand-name");
  });

  it("단일 단어 PascalCase → 소문자", () => {
    expect(normalizeType("Brand")).toBe("brand");
    expect(normalizeType("Color")).toBe("color");
  });

  it("연속 대문자 약어 처리 (AI → ai)", () => {
    expect(normalizeType("AIIllustration")).toBe("ai-illustration");
  });

  it("이미 kebab-case면 그대로 반환", () => {
    expect(normalizeType("brand-name")).toBe("brand-name");
  });

  it("이미 소문자면 그대로 반환", () => {
    expect(normalizeType("brand")).toBe("brand");
  });

  it("undefined → undefined 반환", () => {
    expect(normalizeType(undefined)).toBeUndefined();
  });

  it("빈 문자열 → 빈 문자열", () => {
    expect(normalizeType("")).toBe("");
  });

  it("숫자 포함 타입 처리", () => {
    expect(normalizeType("Color2D")).toBe("color2-d");
    expect(normalizeType("H1Heading")).toBe("h1-heading");
  });

  it("멱등성 — 이중 적용해도 결과 동일", () => {
    const types = ["BrandName", "AIIllustration", "CoreValue", "brand-name"];
    for (const t of types) {
      expect(normalizeType(normalizeType(t))).toBe(normalizeType(t));
    }
  });

  it("복합 PascalCase 변환", () => {
    expect(normalizeType("CoreValue")).toBe("core-value");
    expect(normalizeType("LogoVariant")).toBe("logo-variant");
    expect(normalizeType("VisualLanguage")).toBe("visual-language");
    expect(normalizeType("VisualType")).toBe("visual-type");
    expect(normalizeType("UsageRule")).toBe("usage-rule");
    expect(normalizeType("NameOrigin")).toBe("name-origin");
  });
});
