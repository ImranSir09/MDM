
import React from 'react';

interface NumberInputProps {
    label: string;
    id: string;
    value: number;
    onChange: (newValue: number) => void;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, id, value, onChange, min = 0, max, step = 1, disabled = false }) => {
    const handleIncrement = () => {
        const newValue = parseFloat((value + step).toPrecision(15));
        if (max === undefined || newValue <= max) {
            onChange(newValue);
        }
    };

    const handleDecrement = () => {
        const newValue = parseFloat((value - step).toPrecision(15));
        if (min === undefined || newValue >= min) {
            onChange(newValue);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const numValue = parseFloat(e.target.value);
        if (isNaN(numValue)) {
            onChange(min); // or handle as empty string if needed
            return;
        }

        let finalValue = numValue;
        if (max !== undefined && finalValue > max) finalValue = max;
        if (min !== undefined && finalValue < min) finalValue = min;
        
        onChange(finalValue);
    };

    return (
        <div>
            <label htmlFor={id} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 ml-0.5">
                {label}
            </label>
            <div className="flex items-center shadow-sm rounded-xl">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={disabled || value <= min}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 border-r-0 rounded-l-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Decrease ${label}`}
                >
                    -
                </button>
                <input
                    id={id}
                    type="number"
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm text-center focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block p-2.5 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={disabled || (max !== undefined && value >= max)}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 border-l-0 rounded-r-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Increase ${label}`}
                >
                    +
                </button>
            </div>
        </div>
    );
};

export default NumberInput;
