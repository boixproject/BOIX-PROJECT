import React from 'react';
import { PauseStrength } from '../types';

interface PauseSelectorProps {
  currentStrength: PauseStrength;
  onChange: (strength: PauseStrength) => void;
  disabled: boolean;
}

const PauseSelector: React.FC<PauseSelectorProps> = ({ currentStrength, onChange, disabled }) => {
  return (
    <div className="flex flex-col gap-2 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800">
      <label htmlFor="pause-select" className="text-neutral-500 text-xs font-bold uppercase tracking-wider">
        Speaking Style
      </label>
      <div className="relative w-full">
        <select
          id="pause-select"
          value={currentStrength}
          onChange={(e) => onChange(e.target.value as PauseStrength)}
          disabled={disabled}
          className="w-full appearance-none bg-black text-neutral-200 pl-3 pr-10 py-2 rounded-md border border-neutral-800 hover:border-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          <option value={PauseStrength.None}>Cepat (Rapat)</option>
          <option value={PauseStrength.Normal}>Natural (Orang Asli)</option>
          <option value={PauseStrength.Strong}>Dramatis (Bercerita)</option>
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

export default PauseSelector;