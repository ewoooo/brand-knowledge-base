import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/gemini", () => ({
  generateImage: vi.fn(),
}));

import { generateImageAction } from "@/app/actions/generate";
import { generateImage } from "@/lib/gemini";

const mockGenerateImage = generateImage as ReturnType<typeof vi.fn>;

describe("generateImageAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("유효한 입력으로 이미지를 생성한다", async () => {
    mockGenerateImage.mockResolvedValueOnce({
      success: true,
      image: "data:image/png;base64,abc123",
    });

    const result = await generateImageAction({
      prompt: "a cat",
      style: "watercolor",
    });

    expect(result.success).toBe(true);
    expect(result.image).toBe("data:image/png;base64,abc123");
    expect(mockGenerateImage).toHaveBeenCalledWith({
      prompt: "a cat",
      style: "watercolor",
    });
  });

  it("빈 프롬프트는 에러를 반환한다", async () => {
    const result = await generateImageAction({
      prompt: "   ",
      style: "watercolor",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("프롬프트를 입력해주세요");
    expect(mockGenerateImage).not.toHaveBeenCalled();
  });

  it("빈 스타일은 에러를 반환한다", async () => {
    const result = await generateImageAction({
      prompt: "a cat",
      style: "",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("스타일을 선택해주세요");
    expect(mockGenerateImage).not.toHaveBeenCalled();
  });
});
