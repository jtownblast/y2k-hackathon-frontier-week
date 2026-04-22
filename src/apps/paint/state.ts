import { create } from 'zustand';
import type { ToolId } from './tools';

export type ShapeFill = 'outline' | 'filled';

interface PaintStore {
  tool: ToolId;
  primary: string;
  secondary: string;
  shapeFill: ShapeFill;

  setTool: (tool: ToolId) => void;
  setPrimary: (hex: string) => void;
  setSecondary: (hex: string) => void;
  setShapeFill: (fill: ShapeFill) => void;
}

export const usePaint = create<PaintStore>((set) => ({
  tool: 'pencil',
  primary: '#000000',
  secondary: '#FFFFFF',
  shapeFill: 'outline',

  setTool: (tool) => set({ tool }),
  setPrimary: (hex) => set({ primary: hex }),
  setSecondary: (hex) => set({ secondary: hex }),
  setShapeFill: (shapeFill) => set({ shapeFill }),
}));
