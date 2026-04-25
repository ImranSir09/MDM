
import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './hooks/useData';
import { ThemeProvider } from './hooks/useTheme';
import { NotificationProvider } from './hooks/useNotifications';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Dashboard from './components/pages/Dashboard';
import MonthlySummary from './components/pages/MonthlySummary';
import Receipts from './components/pages/Receipts';
import Settings from './components/pages/Settings';
import Reports from './components/pages/Reports';
import CashbookPage from './components/pages/CashbookPage';
import Header from './components/layout/Header';
import Navigation from './components/layout/Navigation';
import ToastContainer from './components/ui/ToastContainer';
import LoginPage from './components/pages/LoginPage';
import SetupPage from './components/pages/SetupPage';
import WelcomePage from './components/pages/WelcomePage';
import Modal from './components/ui/Modal';
import Button from './components/ui/Button';
import { Page } from './types';

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <DataProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </DataProvider>
        </ThemeProvider>
    );
};

const AppContent: React.FC = () => {
    const { data } = useData();
    const { isAuthenticated } = useAuth();
    
    useEffect(() => {
        const loader = document.getElementById('app-loader');
        if (loader) {
            // Start fade out animation
            loader.style.opacity = '0';
            
            // Remove the loader from the DOM after the transition is complete
            const handleTransitionEnd = () => {
                loader.remove();
                loader.removeEventListener('transitionend', handleTransitionEnd);
            };
            loader.addEventListener('transitionend', handleTransitionEnd);

            // As a fallback in case the event doesn't fire, remove it after a timeout
            setTimeout(() => {
                loader?.remove();
            }, 500); // This duration should match the CSS transition duration
        }
    }, []);

    const needsSetup = !data.auth?.password;

    if (needsSetup) {
        return <SetupPage />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }
    
    // If authenticated, but the welcome screen hasn't been shown, show it.
    if (data.welcomeScreenShown === false) {
        return <WelcomePage />;
    }
    
    return <AuthenticatedApp />;
};

const AuthenticatedApp: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(() => {
        const initialPage = sessionStorage.getItem('initialPage') as Page | null;
        if (initialPage === 'settings') {
            sessionStorage.removeItem('initialPage'); // Consume the one-time flag
            return 'settings';
        }
        return 'dashboard'; // Default for all other sessions
    });

    const [showPaymentModal, setShowPaymentModal] = useState(() => {
        return !sessionStorage.getItem('paymentModalShown');
    });

    const handleClosePaymentModal = () => {
        sessionStorage.setItem('paymentModalShown', 'true');
        setShowPaymentModal(false);
    };

    const pages: Record<Page, React.ReactElement> = {
        dashboard: <Dashboard />,
        summary: <MonthlySummary />,
        receipts: <Receipts />,
        cashbook: <CashbookPage />,
        settings: <Settings />,
        reports: <Reports />,
    };

    const renderPage = () => pages[currentPage] || pages.dashboard;

    return (
        <NotificationProvider setCurrentPage={setCurrentPage}>
            <div className="min-h-screen text-slate-800 dark:text-slate-200 font-sans">
                {/* Clean Background Layer */}
                <div className="fixed inset-0 z-0 bg-slate-50 dark:bg-slate-950">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/40 via-slate-50 to-slate-50 dark:from-indigo-900/20 dark:via-slate-950 dark:to-slate-950"></div>
                </div>
                
                {/* Fixed Header Layer */}
                <div className="fixed top-0 left-0 right-0 z-20">
                    <div className="container mx-auto max-w-2xl p-2 sm:p-4">
                        <Header />
                    </div>
                </div>

                {/* Content Layer */}
                <div className="container mx-auto p-2 pb-28 max-w-2xl relative z-10 pt-28">
                    <main>
                        <div key={currentPage} className="page-transition-wrapper">
                            {renderPage()}
                        </div>
                    </main>
                </div>
                
                <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
            
            <Modal isOpen={showPaymentModal} onClose={handleClosePaymentModal} title="Service Continuation">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="bg-sky-100 dark:bg-sky-900/50 p-4 rounded-full">
                        <svg className="w-8 h-8 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">
                        Please pay a minimum of <strong className="text-slate-800 dark:text-white">₹100/annually</strong> for the continuation of the service.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl w-full border border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Pay via UPI to:</p>
                        <p className="text-lg font-mono font-semibold text-indigo-700 dark:text-indigo-400">+919596555467</p>
                    </div>
                    <Button onClick={handleClosePaymentModal} className="w-full mt-2">
                        I Understand
                    </Button>
                </div>
            </Modal>

            <ToastContainer />
        </NotificationProvider>
    );
};

export default App;