import React, { useState, useCallback, useRef, useEffect } from 'react';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftPercent?: number;
  storageKey: string;
  minLeftPercent?: number;
  maxLeftPercent?: number;
}

export function ResizablePanel({
  left,
  right,
  defaultLeftPercent = 40,
  storageKey,
  minLeftPercent = 20,
  maxLeftPercent = 70,
}: ResizablePanelProps) {
  const [leftPercent, setLeftPercent] = useState(() => {
    try {
      const stored = localStorage.getItem(`resizable-${storageKey}`);
      if (stored) {
        const value = parseInt(stored, 10);
        if (value >= minLeftPercent && value <= maxLeftPercent) return value;
      }
    } catch { /* ignore */ }
    return defaultLeftPercent;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;

      const handleMouseMove = (e: MouseEvent) => {
        if (!dragging.current || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const newPercent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        setLeftPercent(
          Math.max(minLeftPercent, Math.min(maxLeftPercent, newPercent)),
        );
      };

      const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        try {
          localStorage.setItem(`resizable-${storageKey}`, String(leftPercent));
        } catch { /* ignore */ }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [storageKey, minLeftPercent, maxLeftPercent, leftPercent],
  );

  useEffect(() => {
    try {
      localStorage.setItem(`resizable-${storageKey}`, String(leftPercent));
    } catch { /* ignore */ }
  }, [leftPercent, storageKey]);

  return (
    <div ref={containerRef} className="flex h-full">
      <div style={{ width: `${leftPercent}%` }} className="border-r overflow-hidden">
        {left}
      </div>
      <div
        className="w-1 cursor-col-resize bg-muted-foreground/32 dark:bg-border hover:bg-primary/50 active:bg-primary transition-colors shrink-0"
        onMouseDown={handleMouseDown}
      />
      <div style={{ width: `${100 - leftPercent}%` }} className="overflow-hidden">
        {right}
      </div>
    </div>
  );
}
