
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
            
            <ToastContainer />
        </NotificationProvider>
    );
};

export default App;