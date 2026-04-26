
import React from 'react';
import { useData } from '../../hooks/useData';
import Card from '../ui/Card';
import Button from '../ui/Button';

const WelcomePage: React.FC = () => {
    const { markWelcomeAsShown } = useData();

    const handleContinue = () => {
        sessionStorage.setItem('initialPage', 'settings');
        markWelcomeAsShown();
    };

    return (
        <div className="min-h-screen font-sans flex items-center justify-center p-4 relative z-10">
            {/* Content */}
            <div className="container mx-auto max-w-md relative z-10">
                <Card className="w-full text-center">
                    <div className="p-6">
                        <div className="flex justify-center mb-6">
                            <img src="icon.png" alt="PM Poshan Pro" className="w-24 h-24 drop-shadow-lg" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Welcome to PM Poshan Pro!</h1>
                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                            Thank you for choosing this app to manage your Mid-Day Meal records. I've designed it to be simple, reliable, and completely offline-first.
                        </p>
                        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                            To get started, please take a moment to fill in your school's details in the settings. This is crucial for accurate reports.
                        </p>
                        
                        <div className="mt-6 text-xs pt-4 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                            <p>If you have any questions or feedback, feel free to reach out.</p>
                            <p className="mt-2 text-slate-700 dark:text-slate-300 font-medium">- Imran Gani Mugloo <span className="text-slate-500 dark:text-slate-400 font-normal">(Developer)</span></p>
                            <p><a href="tel:+919149690096" className="text-indigo-600 dark:text-indigo-400 hover:underline">+91 9149690096</a></p>
                            <p><a href="mailto:emraanmugloo123@gmail.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">emraanmugloo123@gmail.com</a></p>
                        </div>

                        <div className="mt-8">
                            <Button onClick={handleContinue} className="w-full py-3">
                                Let's Go to Settings
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default WelcomePage;
