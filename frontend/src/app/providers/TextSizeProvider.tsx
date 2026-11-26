import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { UserRole } from '../../lib/roles';
import { TEXT_SIZE_STORAGE_KEY, TextSizeContext, type TextSizeMode } from './text-size';

export interface TextSizeProviderProps {
  role?: UserRole;
  children: ReactNode;
}

function readStoredTextSize(): TextSizeMode | null {
  try {
    const raw = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    return raw === 'normal' || raw === 'large' ? raw : null;
  } catch {
    return null;
  }
}

export function TextSizeProvider({ role = 'student', children }: TextSizeProviderProps) {
  const [manualOverride, setManualOverride] = useState<TextSizeMode | null>(() =>
    readStoredTextSize(),
  );

  const textSize: TextSizeMode = manualOverride ?? (role === 'parent' ? 'large' : 'normal');

  useEffect(() => {
    if (textSize === 'large') {
      document.documentElement.setAttribute('data-text-size', 'large');
    } else {
      document.documentElement.removeAttribute('data-text-size');
    }
  }, [textSize]);

  const setTextSize = useCallback((next: TextSizeMode) => {
    setManualOverride(next);
    try {
      window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next);
    } catch {
      // Ignore storage quota / private WebView restrictions
    }
  }, []);

  const toggleTextSize = useCallback(() => {
    setTextSize(textSize === 'large' ? 'normal' : 'large');
  }, [setTextSize, textSize]);

  const value = useMemo(
    () => ({ textSize, setTextSize, toggleTextSize }),
    [setTextSize, textSize, toggleTextSize],
  );

  return <TextSizeContext.Provider value={value}>{children}</TextSizeContext.Provider>;
}
