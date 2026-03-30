"use server";

import {
  generateImage,
  type GenerateImageResult,
} from "@/lib/gemini";

interface GenerateImageActionInput {
  prompt: string;
  style: string;
}

export async function generateImageAction(
  input: GenerateImageActionInput,
): Promise<GenerateImageResult> {
  const prompt = input.prompt.trim();
  const style = input.style.trim();

  if (!prompt) {
    return { success: false, error: "프롬프트를 입력해주세요" };
  }

  if (!style) {
    return { success: false, error: "스타일을 선택해주세요" };
  }

  return generateImage({ prompt, style });
}
