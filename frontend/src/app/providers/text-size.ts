import { createContext, useContext } from 'react';

export type TextSizeMode = 'normal' | 'large';

export const TEXT_SIZE_STORAGE_KEY = 'bannha.textSize';

export interface TextSizeContextValue {
  textSize: TextSizeMode;
  setTextSize: (mode: TextSizeMode) => void;
  toggleTextSize: () => void;
}

export const TextSizeContext = createContext<TextSizeContextValue | null>(null);

export function useTextSize(): TextSizeContextValue {
  const ctx = useContext(TextSizeContext);
  if (!ctx) {
    throw new Error('useTextSize must be used within TextSizeProvider');
  }
  return ctx;
}
