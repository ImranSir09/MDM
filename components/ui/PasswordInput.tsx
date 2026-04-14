
import React, { useState } from 'react';

// SVG icons for visibility toggle
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A10.025 10.025 0 00.458 10c1.274 4.057 5.022 7 9.542 7 1.126 0 2.206-.242 3.232-.697l-1.772-1.772z" />
    </svg>
);

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    containerClassName?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({ label, id, containerClassName = '', className, ...props }) => {
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = () => {
        setShowPassword(prev => !prev);
    };

    const baseInputClasses = "w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 block p-2.5 placeholder-slate-400 dark:placeholder-slate-500 pr-10 outline-none transition-all duration-200 shadow-sm";

    return (
        <div className={containerClassName}>
            <label htmlFor={id} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    className={`${baseInputClasses} ${className || ''}`}
                    {...props}
                />
                <button
                    type="button"
                    onClick={toggleVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>
    );
};

export default PasswordInput;
