import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TextSizeProvider } from './TextSizeProvider';
import { useTextSize } from './text-size';

function TextSizeProbe() {
  const { textSize, toggleTextSize } = useTextSize();
  return (
    <button type="button" onClick={toggleTextSize}>
      Cỡ chữ: {textSize}
    </button>
  );
}

describe('TextSizeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-text-size');
  });

  it('defaults to normal for student role', () => {
    render(
      <TextSizeProvider role="student">
        <TextSizeProbe />
      </TextSizeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Cỡ chữ: normal');
    expect(document.documentElement.getAttribute('data-text-size')).toBeNull();
  });

  it('automatically enables large text (18px / 52px) for parent role when no manual override exists', () => {
    render(
      <TextSizeProvider role="parent">
        <TextSizeProbe />
      </TextSizeProvider>,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Cỡ chữ: large');
    expect(document.documentElement.getAttribute('data-text-size')).toBe('large');
  });

  it('respects manual toggle by parent and persists choice in localStorage', async () => {
    const user = userEvent.setup();
    render(
      <TextSizeProvider role="parent">
        <TextSizeProbe />
      </TextSizeProvider>,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('Cỡ chữ: normal');
    expect(window.localStorage.getItem('bannha.textSize')).toBe('normal');
    expect(document.documentElement.getAttribute('data-text-size')).toBeNull();
  });
});
