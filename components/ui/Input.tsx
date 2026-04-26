
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    containerClassName?: string;
    wrapperClassName?: string;
}

const Input: React.FC<InputProps> = ({ label, id, containerClassName = '', wrapperClassName = '', className, ...props }) => {
    const baseClasses = "w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 block p-2.5 placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-200 shadow-sm";
    return (
        <div className={containerClassName || wrapperClassName}>
            <label htmlFor={id} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 ml-0.5">
                {label}
            </label>
            <input id={id} className={`${baseClasses} ${className || ''}`} {...props} />
        </div>
    );
};

export default Input;
