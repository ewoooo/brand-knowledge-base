import { describe, it, expect, vi, beforeEach } from "vitest";

// @google/genai 모듈 모킹
vi.mock("@google/genai", () => {
  const mockGenerateContent = vi.fn();
  return {
    GoogleGenAI: vi.fn().mockImplementation(function () {
      return {
        models: {
          generateContent: mockGenerateContent,
        },
      };
    }),
    __mockGenerateContent: mockGenerateContent,
  };
});

import { generateImage } from "@/lib/gemini";

// 모킹된 함수 가져오기
const { __mockGenerateContent: mockGenerateContent } = await import(
  "@google/genai"
);

describe("generateImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("GOOGLE_API_KEY", "test-key");
  });

  it("프롬프트와 스타일로 이미지를 생성하고 base64를 반환한다", async () => {
    (mockGenerateContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: "iVBORw0KGgo=",
                },
              },
            ],
          },
        },
      ],
    });

    const result = await generateImage({
      prompt: "a fox in a forest",
      style: "watercolor",
    });

    expect(result.success).toBe(true);
    expect(result.image).toBe("data:image/png;base64,iVBORw0KGgo=");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-2.5-flash-preview-image-generation",
        contents: expect.stringContaining("a fox in a forest"),
      }),
    );
  });

  it("API 키가 없으면 에러를 반환한다", async () => {
    vi.stubEnv("GOOGLE_API_KEY", "");

    const result = await generateImage({
      prompt: "test",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("API 키가 설정되지 않았습니다");
  });

  it("API 호출 실패 시 에러를 반환한다", async () => {
    (mockGenerateContent as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("API error"),
    );

    const result = await generateImage({
      prompt: "test",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("이미지 생성에 실패했습니다. 다시 시도해주세요");
  });

  it("응답에 이미지가 없으면 에러를 반환한다", async () => {
    (mockGenerateContent as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      candidates: [
        {
          content: {
            parts: [{ text: "I cannot generate that image." }],
          },
        },
      ],
    });

    const result = await generateImage({
      prompt: "test",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("이미지를 생성할 수 없습니다");
  });
});
