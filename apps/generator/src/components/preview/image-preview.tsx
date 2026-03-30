"use client";

import { Button } from "@/components/ui/button";
import { Download, ImageIcon, Loader2 } from "lucide-react";

interface ImagePreviewProps {
  image: string | null;
  loading: boolean;
  error: string | null;
}

export function ImagePreview({ image, loading, error }: ImagePreviewProps) {
  function handleDownload() {
    if (!image) return;
    const link = document.createElement("a");
    link.href = image;
    link.download = `generated-${Date.now()}.png`;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">이미지 생성 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (image) {
    return (
      <div className="flex h-full flex-col gap-4 p-4">
        <div className="relative flex-1 overflow-hidden rounded-lg">
          <img
            src={image}
            alt="Generated image"
            className="h-full w-full object-contain"
          />
        </div>
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          다운로드
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <ImageIcon className="text-muted-foreground/30 h-12 w-12" />
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">
          프롬프트를 입력하고 생성 버튼을 눌러주세요
        </p>
      </div>
    </div>
  );
}
