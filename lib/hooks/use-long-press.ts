'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // Duration in milliseconds
  onProgress?: (progress: number) => void; // Progress callback (0-1)
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500,
  onProgress
}: UseLongPressOptions) {
  const isLongPress = useRef(false);
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const progressInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTime = useRef<number>(0);
  const [isPressed, setIsPressed] = useState(false);

  const updateProgress = useCallback(() => {
    if (!onProgress || !startTime.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / threshold, 1);
    onProgress(progress);

    if (progress < 1) {
      progressInterval.current = setTimeout(updateProgress, 16); // ~60fps
    }
  }, [onProgress, threshold]);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Prevent default behavior to avoid text selection on iOS
      event.preventDefault();
      isLongPress.current = false;
      setIsPressed(true);
      startTime.current = Date.now();

      // Start progress tracking
      if (onProgress) {
        onProgress(0);
        updateProgress();
      }

      timeout.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress();
        setIsPressed(false);
        if (onProgress) {
          onProgress(0); // Reset progress after long press
        }
      }, threshold);
    },
    [onLongPress, threshold, onProgress, updateProgress]
  );

  const clear = useCallback(
    (event?: React.MouseEvent | React.TouchEvent) => {
      if (event) {
        event.preventDefault();
      }
      setIsPressed(false);
      startTime.current = 0;

      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }

      if (progressInterval.current) {
        clearTimeout(progressInterval.current);
        progressInterval.current = undefined;
      }

      if (onProgress) {
        onProgress(0); // Reset progress
      }
    },
    [onProgress]
  );

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (!isLongPress.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (progressInterval.current) {
        clearTimeout(progressInterval.current);
      }
    };
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick,
    isPressed
  };
}
