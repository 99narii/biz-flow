import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeHandlers) {
  const touchState = useRef<TouchState | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      // 스와이프 조건: 최소 50px 이동, 500ms 이내, 수평 이동이 수직보다 클 것
      const minSwipeDistance = 50;
      const maxSwipeTime = 500;

      if (
        Math.abs(deltaX) > minSwipeDistance &&
        Math.abs(deltaX) > Math.abs(deltaY) &&
        deltaTime < maxSwipeTime
      ) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      touchState.current = null;
    },
    [onSwipeLeft, onSwipeRight]
  );

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}
