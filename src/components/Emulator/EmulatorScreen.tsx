import { useEffect, useRef } from "react";

// Memory Constants
const SCREEN_WIDTH = 512;
const SCREEN_HEIGHT = 256;
const SCREEN_START_ADDR = 16384;
const SCREEN_WORDS = 8192; // 512 * 256 / 16

interface EmulatorScreenProps {
  getRamRange: (start: number, count: number) => number[];
  frameCount: number; // New dependency to trigger re-render
}

export function EmulatorScreen({ getRamRange, frameCount }: EmulatorScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!ctx) return;

    const screenMemory = getRamRange(SCREEN_START_ADDR, SCREEN_WORDS);
    const imageData = ctx.createImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    const data = imageData.data;

    // --- ADD THIS RESET BLOCK ---
    // Fill the buffer with 255 (White) and set all Alpha to 255
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = 255; // Alpha
    }
    // ----------------------------

    for (let i = 0; i < SCREEN_WORDS; i++) {
      const word = screenMemory[i];
      if (word === 0) continue; 

      for (let bit = 0; bit < 16; bit++) {
        const isSet = (word >> (15 - bit)) & 1;
        if (isSet) { // Only draw if bit is 1 (Black)
          const pixelIdx = (i * 16 + bit) * 4;
          data[pixelIdx] = 0;     // R
          data[pixelIdx + 1] = 0; // G
          data[pixelIdx + 2] = 0; // B
          // Alpha is already 255
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [frameCount, getRamRange]); // Re-draws only when frameCount changes

  return (
    <canvas 
      ref={canvasRef} 
      width={SCREEN_WIDTH} 
      height={SCREEN_HEIGHT} 
      className="bg-black w-full h-auto aspect-[2/1] border border-slate-800 rounded shadow-inner"
    />
  );
}