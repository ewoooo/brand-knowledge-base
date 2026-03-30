"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const STYLES = [
  { value: "photorealistic", label: "Photorealistic" },
  { value: "watercolor", label: "Watercolor" },
  { value: "oil-painting", label: "Oil Painting" },
  { value: "sketch", label: "Sketch" },
  { value: "pixel-art", label: "Pixel Art" },
  { value: "anime", label: "Anime" },
  { value: "vintage", label: "Vintage" },
  { value: "modern", label: "Modern" },
  { value: "abstract", label: "Abstract" },
  { value: "minimalist", label: "Minimalist" },
] as const;

interface StyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StyleSelector({
  value,
  onChange,
  disabled,
}: StyleSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-muted-foreground text-xs font-medium uppercase">
        스타일
      </label>
      <ToggleGroup
        value={[value]}
        onValueChange={(values) => {
          const next = values[values.length - 1];
          if (next) onChange(next);
        }}
        className="flex flex-wrap justify-start gap-1.5"
        disabled={disabled}
      >
        {STYLES.map((style) => (
          <ToggleGroupItem
            key={style.value}
            value={style.value}
            className="rounded-full px-3 py-1 text-xs"
          >
            {style.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
