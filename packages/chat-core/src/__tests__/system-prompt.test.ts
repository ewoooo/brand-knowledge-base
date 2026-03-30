import { describe, it, expect } from "vitest";
import { DEFAULT_SYSTEM_PROMPT, buildSystemMessage } from "../system-prompt";

describe("DEFAULT_SYSTEM_PROMPT", () => {
    it("한국어로 답변하도록 지시한다", () => {
        expect(DEFAULT_SYSTEM_PROMPT).toContain("한국어");
    });

    it("컨텍스트 외 추측을 금지한다", () => {
        expect(DEFAULT_SYSTEM_PROMPT).toContain("추측하지 마세요");
    });
});

describe("buildSystemMessage", () => {
    const graphContext = "## 노드\n- Primary Blue (color)";

    it("기본 프롬프트 + 그래프 컨텍스트를 조합한다", () => {
        const result = buildSystemMessage(graphContext);

        expect(result).toContain(DEFAULT_SYSTEM_PROMPT);
        expect(result).toContain(graphContext);
    });

    it("커스텀 프롬프트가 있으면 기본 프롬프트를 대체한다", () => {
        const custom = "당신은 색상 전문가입니다.";
        const result = buildSystemMessage(graphContext, custom);

        expect(result).not.toContain(DEFAULT_SYSTEM_PROMPT);
        expect(result).toContain(custom);
        expect(result).toContain(graphContext);
    });

    it("빈 커스텀 프롬프트는 기본 프롬프트를 사용한다", () => {
        const result = buildSystemMessage(graphContext, "");

        expect(result).toContain(DEFAULT_SYSTEM_PROMPT);
    });

    it("빈 그래프 컨텍스트도 정상 처리한다", () => {
        const result = buildSystemMessage("");

        expect(result).toContain(DEFAULT_SYSTEM_PROMPT);
        expect(result).toBeDefined();
    });
});
