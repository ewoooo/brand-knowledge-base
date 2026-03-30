import { GoogleGenAI } from "@google/genai";

export interface GenerateImageRequest {
  prompt: string;
  style: string;
}

export interface GenerateImageResult {
  success: boolean;
  image?: string;
  error?: string;
}

const STYLE_PROMPTS: Record<string, string> = {
  photorealistic: "photorealistic style, high detail, sharp focus",
  watercolor: "watercolor painting style, soft edges, flowing colors",
  "oil-painting": "oil painting style, rich textures, bold brushstrokes",
  sketch: "pencil sketch style, line drawing, monochrome",
  "pixel-art": "pixel art style, retro game aesthetic, 8-bit",
  anime: "anime style, cel-shaded, vibrant colors",
  vintage: "vintage style, retro, film grain, faded colors",
  modern: "modern design style, clean, minimal, contemporary",
  abstract: "abstract art style, non-representational, expressive",
  minimalist: "minimalist style, simple shapes, limited palette",
};

export async function generateImage(
  request: GenerateImageRequest,
): Promise<GenerateImageResult> {
  const apiKey = process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return { success: false, error: "API 키가 설정되지 않았습니다" };
  }

  const ai = new GoogleGenAI({ apiKey });

  const styleHint = STYLE_PROMPTS[request.style] ?? request.style;
  const fullPrompt = `${request.prompt}. Style: ${styleHint}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-image-generation",
      contents: fullPrompt,
      config: {
        responseModalities: ["image", "text"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return { success: false, error: "이미지를 생성할 수 없습니다" };
    }

    for (const part of parts) {
      if (part.inlineData) {
        const { mimeType, data } = part.inlineData;
        return {
          success: true,
          image: `data:${mimeType};base64,${data}`,
        };
      }
    }

    return { success: false, error: "이미지를 생성할 수 없습니다" };
  } catch {
    return {
      success: false,
      error: "이미지 생성에 실패했습니다. 다시 시도해주세요",
    };
  }
}
