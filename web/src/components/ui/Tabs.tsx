import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../../lib/cx';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: ReadonlyArray<TabItem>;
  defaultValue?: string;
  value?: string;
  onValueChange?: (id: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs({
  items,
  defaultValue,
  value,
  onValueChange,
  ariaLabel = 'Các mục nội dung',
  className,
}: TabsProps) {
  const baseId = useId();
  const [internalId, setInternalId] = useState<string>(() => defaultValue ?? items[0]?.id ?? '');
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeId = value ?? internalId;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId),
  );
  const activeItem = items[activeIndex];

  const selectIndex = (nextIndex: number, moveFocus: boolean) => {
    const target = items[nextIndex];
    if (!target) return;
    if (value === undefined) {
      setInternalId(target.id);
    }
    onValueChange?.(target.id);
    if (moveFocus) {
      buttonRefs.current[nextIndex]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectIndex((index + 1) % items.length, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectIndex((index - 1 + items.length) % items.length, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectIndex(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      selectIndex(items.length - 1, true);
    }
  };

  return (
    <div className={cx('flex flex-col gap-3', className)}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex gap-1.5 overflow-x-auto rounded-card border border-line bg-surface p-1"
      >
        {items.map((item, idx) => {
          const selected = idx === activeIndex;
          return (
            <button
              key={item.id}
              ref={(el) => {
                buttonRefs.current[idx] = el;
              }}
              id={`${baseId}-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectIndex(idx, false)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={cx(
                'min-h-[var(--control-height)] shrink-0 rounded-control px-3.5 py-2 text-[length:var(--font-size-sub)] font-semibold transition-colors duration-150',
                selected ? 'bg-forest-700 text-surface' : 'text-ink hover:bg-forest-50',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {activeItem ? (
        <div
          id={`${baseId}-panel-${activeItem.id}`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
