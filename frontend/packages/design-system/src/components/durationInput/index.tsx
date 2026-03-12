/**
 * External dependencies.
 */

import { useState } from "react";
import { Slider } from "@base-ui/react/slider";

const SLIDER_STEP_MINUTES = 30;

const formatMinutesToHHMM = (minutes: number): string => {
  const hoursPart = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minsPart = String(minutes % 60).padStart(2, "0");
  return `${hoursPart}:${minsPart}`;
};

const parseHHMMToMinutes = (value: string): number | null => {
  const trimmedValue = value.trim();
  const hhmmMatch = /^([0-9]{1,2}):([0-9]{2})$/.exec(trimmedValue);
  if (!hhmmMatch) {
    return null;
  }

  const hours = Number(hhmmMatch[1]);
  const mins = Number(hhmmMatch[2]);

  if (Number.isNaN(hours) || Number.isNaN(mins) || mins < 0 || mins > 59) {
    return null;
  }

  return hours * 60 + mins;
};

const snapToSliderStep = (minutes: number): number => {
  return Math.round(minutes / SLIDER_STEP_MINUTES) * SLIDER_STEP_MINUTES;
};

interface DurationInputProps {
  label?: string;
  maxDurationInHours?: number;
  value?: number;
  onChange?: (value: number) => void;
}

const DurationInput = ({ 
  label = "Duration", 
  maxDurationInHours = 8,
  value = 0,
  onChange
}: DurationInputProps) => {
  const [duration, setDuration] = useState(value);
  const [inputValue, setInputValue] = useState(formatMinutesToHHMM(value));

  const totalMinutes = maxDurationInHours * 60;
  const usedMinutes = duration;
  const remainingMins = (totalMinutes - usedMinutes) % 60;
  const remainingHours = Math.floor((totalMinutes - usedMinutes) / 60);

  const handleSliderChange = (nextValue: number | number[]) => {
    const normalizedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    const clampedValue = Math.min(Math.max(normalizedValue, 0), totalMinutes);
    setDuration(clampedValue);
    setInputValue(formatMinutesToHHMM(clampedValue));
    onChange?.(clampedValue / 60);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const parsedMinutes = parseHHMMToMinutes(value);
    if (parsedMinutes === null) {
      return;
    }
    const clampedValue = Math.min(Math.max(parsedMinutes, 0), totalMinutes);
    setDuration(clampedValue);
    onChange?.(clampedValue / 60);
  };

  const handleInputBlur = () => {
    const parsedMinutes = parseHHMMToMinutes(inputValue);
    if (parsedMinutes === null) {
      setInputValue(formatMinutesToHHMM(duration));
      return;
    }
    const clampedValue = Math.min(Math.max(parsedMinutes, 0), totalMinutes);
    setDuration(clampedValue);
    setInputValue(formatMinutesToHHMM(clampedValue));
    onChange?.(clampedValue / 60);
  };

  const sliderValue = snapToSliderStep(duration);

  return (
    <div className="space-y-1.5">
      <div className="w-full flex justify-between text-xs text-ink-gray-5 ">
        <label>{label}</label>
        <p>
          {remainingHours}h {remainingMins}m left
        </p>
      </div>
      <div className="relative">
        <Slider.Root
          defaultValue={0}
          min={0}
          max={totalMinutes}
          step={SLIDER_STEP_MINUTES}
          value={sliderValue}
          onValueChange={handleSliderChange}
        >
          <Slider.Control className="flex items-center relative focus:border-outline-gray-4 focus:shadow-sm focus:ring-0 focus-visible:ring-2 focus-visible:ring-outline-gray-3">
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
