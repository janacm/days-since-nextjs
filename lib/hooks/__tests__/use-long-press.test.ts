import { renderHook, act } from '@testing-library/react';
import { useLongPress } from '../use-long-press';

// Mock timers
jest.useFakeTimers();

describe('useLongPress', () => {
  const mockOnLongPress = jest.fn();
  const mockOnClick = jest.fn();
  const mockOnProgress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it('should call onClick on quick click', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Simulate mouse up before threshold
    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onMouseUp(mockEvent);
    });

    // Simulate click
    act(() => {
      result.current.onClick(mockEvent);
    });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnLongPress).not.toHaveBeenCalled();
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should call onLongPress after threshold time', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Advance time past threshold
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should not call onClick after long press', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Advance time past threshold to trigger long press
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Simulate mouse up and click after long press
    act(() => {
      result.current.onMouseUp(mockEvent);
      result.current.onClick(mockEvent);
    });

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('should cancel long press on mouse leave', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Simulate mouse leave before threshold
    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onMouseLeave(mockEvent);
    });

    // Advance time past original threshold
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(mockOnLongPress).not.toHaveBeenCalled();
  });

  it('should work with touch events', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate touch start
    act(() => {
      result.current.onTouchStart(mockEvent);
    });

    // Advance time past threshold
    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should cancel long press on touch end', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate touch start
    act(() => {
      result.current.onTouchStart(mockEvent);
    });

    // Simulate touch end before threshold
    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onTouchEnd(mockEvent);
    });

    // Advance time past original threshold
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(mockOnLongPress).not.toHaveBeenCalled();
  });

  it('should use custom threshold', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 1000
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Advance time to just before custom threshold
    act(() => {
      jest.advanceTimersByTime(900);
    });

    expect(mockOnLongPress).not.toHaveBeenCalled();

    // Advance time past custom threshold
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
  });

  it('should use default threshold when not provided', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Advance time to just before default threshold (500ms)
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(mockOnLongPress).not.toHaveBeenCalled();

    // Advance time past default threshold
    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
  });

  it('should work without onClick handler', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate quick click without onClick handler
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onMouseUp(mockEvent);
    });

    act(() => {
      result.current.onClick(mockEvent);
    });

    // Should not throw error and should not call onLongPress
    expect(mockOnLongPress).not.toHaveBeenCalled();
  });

  it('should prevent default on all events', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Test all event handlers call preventDefault
    act(() => {
      result.current.onMouseDown(mockEvent);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();

    mockEvent.preventDefault.mockClear();

    act(() => {
      result.current.onMouseUp(mockEvent);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();

    mockEvent.preventDefault.mockClear();

    act(() => {
      result.current.onMouseLeave(mockEvent);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();

    mockEvent.preventDefault.mockClear();

    act(() => {
      result.current.onTouchStart(mockEvent);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();

    mockEvent.preventDefault.mockClear();

    act(() => {
      result.current.onTouchEnd(mockEvent);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();

    mockEvent.preventDefault.mockClear();

    act(() => {
      result.current.onClick(mockEvent);
    });
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should handle multiple rapid interactions correctly', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // First interaction - quick click
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    act(() => {
      jest.advanceTimersByTime(200);
      result.current.onMouseUp(mockEvent);
    });

    act(() => {
      result.current.onClick(mockEvent);
    });

    // Second interaction - long press
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
  });

  it('should track progress during long press', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 1000,
        onProgress: mockOnProgress
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Progress should start at 0
    expect(mockOnProgress).toHaveBeenCalledWith(0);

    // Advance time and check progress updates
    act(() => {
      jest.advanceTimersByTime(250); // 25% of 1000ms
    });

    // Should have called progress with values between 0 and 0.25
    expect(mockOnProgress).toHaveBeenCalledWith(expect.any(Number));

    act(() => {
      jest.advanceTimersByTime(250); // 50% of 1000ms total
    });

    act(() => {
      jest.advanceTimersByTime(500); // 100% of 1000ms total
    });

    // Should have been called multiple times with increasing values
    expect(mockOnProgress.mock.calls.length).toBeGreaterThan(1);

    // After long press completes, progress should reset to 0
    expect(mockOnProgress).toHaveBeenLastCalledWith(0);
  });

  it('should reset progress when interaction is cancelled', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 1000,
        onProgress: mockOnProgress
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Simulate mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Cancel by mouse up
    act(() => {
      result.current.onMouseUp(mockEvent);
    });

    // Progress should reset to 0
    expect(mockOnProgress).toHaveBeenLastCalledWith(0);
  });

  it('should return isPressed state correctly', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Initially not pressed
    expect(result.current.isPressed).toBe(false);

    // Should be pressed after mouse down
    act(() => {
      result.current.onMouseDown(mockEvent);
    });
    expect(result.current.isPressed).toBe(true);

    // Should not be pressed after mouse up
    act(() => {
      result.current.onMouseUp(mockEvent);
    });
    expect(result.current.isPressed).toBe(false);
  });

  it('should reset isPressed state after long press completes', () => {
    const { result } = renderHook(() =>
      useLongPress({
        onLongPress: mockOnLongPress,
        onClick: mockOnClick,
        threshold: 500
      })
    );

    const mockEvent = {
      preventDefault: jest.fn()
    } as any;

    // Start press
    act(() => {
      result.current.onMouseDown(mockEvent);
    });
    expect(result.current.isPressed).toBe(true);

    // Complete long press
    act(() => {
      jest.advanceTimersByTime(600);
    });

    // Should automatically reset isPressed after long press
    expect(result.current.isPressed).toBe(false);
  });
});
