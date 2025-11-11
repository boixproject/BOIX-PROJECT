import React from 'react';

interface SpeedSelectorProps {
  currentSpeed: number;
  onChange: (speed: number) => void;
  disabled: boolean;
}

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const SpeedSelector: React.FC<SpeedSelectorProps> = ({ currentSpeed, onChange, disabled }) => {
  return (
    <div className="flex flex-col gap-2 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
      <label htmlFor="speed-select" className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
        Playback Speed
      </label>
      <div className="relative w-full">
        <select
          id="speed-select"
          value={currentSpeed}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full appearance-none bg-black text-neutral-200 pl-3 pr-10 py-2 rounded-md border border-neutral-800 hover:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}x Speed
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SpeedSelector;