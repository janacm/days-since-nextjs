'use client';

import { useState, type ChangeEvent } from 'react';
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
import {
  formatDateDisplay,
  parseDateInput,
  todayIsoDate
} from '@/lib/date-input';
import { resetEvent, resetEventWithDate } from './actions';

interface ResetButtonProps {
  eventId: number;
  onOpenChange?: (open: boolean) => void;
}

export function ResetButton({ eventId, onOpenChange }: ResetButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetDate, setResetDate] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [progress, setProgress] = useState(0);

  const handleQuickReset = () => {
    const formData = new FormData();
    formData.append('id', eventId.toString());
    resetEvent(formData);
  };

  const handleLongPress = () => {
    setIsModalOpen(true);
    // Default to today in the user's local timezone
    const today = todayIsoDate();
    setResetDate(today);
    setDisplayDate(formatDateDisplay(today));
  };

  const handleCustomReset = () => {
    if (!resetDate) return;

    const [y, m, d] = resetDate.split('-').map(Number);
    const formData = new FormData();
    formData.append('id', eventId.toString());
    // Local midnight of the chosen day, so the instant-based counter shows 0 for today in any timezone
    formData.append('resetDate', new Date(y, m - 1, d).toISOString());
    resetEventWithDate(formData);
    setIsModalOpen(false);
  };

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayDate(inputValue);
    setResetDate(parseDateInput(inputValue));
  };

  const isDateInvalid = displayDate.trim() !== '' && !resetDate;

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
                type="text"
                inputMode="text"
                autoComplete="off"
                value={displayDate}
                onChange={handleDateChange}
                placeholder="MMM DD, YYYY"
                aria-invalid={isDateInvalid}
                aria-describedby="reset-date-hint"
                className="col-span-3"
              />
              <p
                id="reset-date-hint"
                role={isDateInvalid ? 'alert' : undefined}
                className={`col-span-3 col-start-2 text-xs ${
                  isDateInvalid ? 'text-destructive' : 'text-muted-foreground'
                }`}
              >
                {isDateInvalid
                  ? 'Enter a valid date, e.g. Jul 07, 2025'
                  : 'Format: MMM DD, YYYY (e.g. Jul 07, 2025)'}
              </p>
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
