'use client';

import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  threshold?: number; // Duration in milliseconds
}

export function useLongPress({
  onLongPress,
  onClick,
  threshold = 500
}: UseLongPressOptions) {
  const isLongPress = useRef(false);
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Prevent default behavior to avoid text selection on iOS
      event.preventDefault();
      isLongPress.current = false;
      timeout.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress();
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const clear = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    if (event) {
      event.preventDefault();
    }
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      if (!isLongPress.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onClick: handleClick
  };
}
