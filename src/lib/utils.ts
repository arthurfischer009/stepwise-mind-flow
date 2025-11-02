import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert an HSL color string like "hsl(221, 83%, 53%)" to HSLA with the given alpha
// Falls back to the original color if parsing fails
export function withAlphaHsl(color: string, alpha: number): string {
  try {
    const match = color.match(/hsl[a]?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
    if (match) {
      const [, h, s, l] = match;
      return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    }
  } catch {
    // Failed to parse HSL color, fall back to original
  }
  return color;
}
