
import React, { useState, useEffect } from 'react';
import { TOAST_EVENT, ToastMessage, ToastType } from '../../hooks/useToast';

const Toast: React.FC<{ message: ToastMessage; onDismiss: (id: string) => void }> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [message.id, onDismiss]);
    
    const typeClasses: Record<ToastType, string> = {
        success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
        error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/50',
        info: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50',
    }

    return (
        <div 
            className={`w-full max-w-sm p-4 rounded-xl shadow-lg text-sm font-medium border ${typeClasses[message.type]} backdrop-blur-md cursor-pointer transition-all`}
            onClick={() => onDismiss(message.id)}
        >
            {message.message}
        </div>
    );
};

const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleShowToast = (event: Event) => {
            const customEvent = event as CustomEvent<ToastMessage>;
            setToasts(prevToasts => [customEvent.detail, ...prevToasts]);
        };

        window.addEventListener(TOAST_EVENT, handleShowToast);
        return () => window.removeEventListener(TOAST_EVENT, handleShowToast);
    }, []);

    const dismissToast = (id: string) => {
        setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} message={toast} onDismiss={dismissToast} />
            ))}
        </div>
    );
};

export default ToastContainer;
