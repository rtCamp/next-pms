/**
 * External dependencies.
 */

import { useEffect, useState } from "react";
import { Slider } from "@base-ui/react/slider";
import { floatToTime } from "../../utils";

const SLIDER_STEP_MINUTES = 30;

const parseDurationToHours = (value: string): number | null => {
  const trimmedValue = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  const hhmmMatch = /^([0-9]{1,2}):([0-9]{2})$/.exec(trimmedValue);
  if (!hhmmMatch) {
    return null;
  }

  const hours = Number(hhmmMatch[1]);
  const mins = Number(hhmmMatch[2]);

  if (Number.isNaN(hours) || Number.isNaN(mins) || mins < 0 || mins > 59) {
    return null;
  }

  return hours + mins / 60;
};

const snapToSliderStep = (minutes: number): number => {
  return Math.round(minutes / SLIDER_STEP_MINUTES) * SLIDER_STEP_MINUTES;
};

export interface DurationInputProps {
  label?: string;
  maxDurationInHours?: number;
  hoursLeft?: number;
  value?: number;
  variant?: "default" | "compact";
  onChange?: (value: number) => void;
}

const DurationInput = ({
  label = "Duration",
  maxDurationInHours = 8,
  hoursLeft = maxDurationInHours,
  value = 0,
  variant = "default",
  onChange,
}: DurationInputProps) => {
  const [durationInHours, setDurationInHours] = useState(value);
  const [inputValue, setInputValue] = useState(floatToTime(value, 2, 2));

  const clampHours = (hours: number) => {
    return Math.min(Math.max(hours, 0), maxDurationInHours);
  };

  const totalMinutes = maxDurationInHours * 60;
  const usedHours = durationInHours;
  const safeHoursLeft = Number.isFinite(hoursLeft) ? hoursLeft : maxDurationInHours;
  const remainingHours = safeHoursLeft - usedHours;
  const isOverHours = remainingHours < 0;
  const formattedRemainingHours = Number(remainingHours.toFixed(1));

  const handleSliderChange = (nextValue: number | number[]) => {
    const nextMinutes = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    const clampedMinutes = Math.min(Math.max(nextMinutes, 0), totalMinutes);
    const nextHours = clampedMinutes / 60;
    setDurationInHours(nextHours);
    setInputValue(floatToTime(nextHours, 2, 2));
    onChange?.(nextHours);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const parsedHours = parseDurationToHours(value);
    if (parsedHours === null) {
      return;
    }
    const clampedHours = clampHours(parsedHours);
    setDurationInHours(clampedHours);
    onChange?.(clampedHours);
  };

  const handleInputBlur = () => {
    const parsedHours = parseDurationToHours(inputValue);
    if (parsedHours === null) {
      setInputValue(floatToTime(durationInHours, 2, 2));
      return;
    }
    const clampedHours = clampHours(parsedHours);
    setDurationInHours(clampedHours);
    setInputValue(floatToTime(clampedHours, 2, 2));
    onChange?.(clampedHours);
  };

  const sliderValue = snapToSliderStep(durationInHours * 60);

  useEffect(() => {
    const clampedHours = clampHours(value);
    setDurationInHours(clampedHours);
    setInputValue(floatToTime(clampedHours, 2, 2));
  }, [value, maxDurationInHours]);

  return (
    <div className="space-y-1.5">
      {variant === "default" ? (
        <div className="w-full flex justify-between text-xs text-ink-gray-5 ">
          <label>{label}</label>
          <p className={isOverHours ? "text-ink-red-4" : undefined}>{formattedRemainingHours}h left</p>
        </div>
      ) : null}
      <div className="relative">
        <Slider.Root
          defaultValue={0}
          min={0}
          max={totalMinutes}
          step={SLIDER_STEP_MINUTES}
          value={sliderValue}
          onValueChange={handleSliderChange}
        >
          <Slider.Control className="flex items-center rounded relative focus:border-outline-gray-4 focus:shadow-sm focus:ring-0 focus-visible:ring-2 focus-visible:ring-outline-gray-3">
            <Slider.Track className="w-full h-8 bg-surface-gray-1 rounded">
              <Slider.Indicator className="rounded bg-surface-gray-3 select-none" />
            </Slider.Track>
          </Slider.Control>
        </Slider.Root>
        <input
          type="text"
          className="absolute -translate-y-1/2 top-1/2 right-0 w-12"
          placeholder="00:00"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
        />
      </div>
    </div>
  );
};

export default DurationInput;
