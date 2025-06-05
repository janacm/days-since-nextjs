'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RotateCcw } from 'lucide-react';
import { useLongPress } from '@/lib/hooks/use-long-press';
import { resetEvent, resetEventWithDate } from './actions';

interface ResetButtonProps {
  eventId: number;
  onOpenChange?: (open: boolean) => void;
}

export function ResetButton({ eventId, onOpenChange }: ResetButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetDate, setResetDate] = useState('');
  const [progress, setProgress] = useState(0);

  const handleQuickReset = () => {
    const formData = new FormData();
    formData.append('id', eventId.toString());
    resetEvent(formData);
  };

  const handleLongPress = () => {
    setIsModalOpen(true);
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setResetDate(today);
  };

  const handleCustomReset = () => {
    if (!resetDate) return;

    const formData = new FormData();
    formData.append('id', eventId.toString());
    formData.append('resetDate', resetDate);
    resetEventWithDate(formData);
    setIsModalOpen(false);
  };

  const longPressResult = useLongPress({
    onLongPress: handleLongPress,
    onClick: handleQuickReset,
    threshold: 800, // 800ms for long press
    onProgress: setProgress
  });

  // Destructure isPressed from the result to avoid passing it to DOM
  const { isPressed, ...longPressProps } = longPressResult;

  // Calculate the stroke-dasharray for the progress circle
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        type="button"
        className="relative select-none touch-manipulation"
        style={{
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        {...longPressProps}
      >
        <RotateCcw className="h-4 w-4 z-10 relative" />

        {/* Progress circle overlay */}
        {isPressed && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 40 40"
          >
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.2"
            />
            {/* Progress circle */}
            <circle
              cx="20"
              cy="20"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-75 ease-linear"
            />
          </svg>
        )}

        <span className="sr-only">
          Reset event (long press for custom date)
        </span>
      </Button>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          onOpenChange?.(open);
        }}
      >
        <DialogContent
          className="sm:max-w-[425px]"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Reset Event</DialogTitle>
            <DialogDescription>
              Choose the date when this event was last reset. This will update
              the &quot;days since&quot; counter accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reset-date" className="text-right">
                Reset Date
              </Label>
              <Input
                id="reset-date"
                type="date"
                value={resetDate}
                onChange={(e) => setResetDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomReset} disabled={!resetDate}>
              Reset to Date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
