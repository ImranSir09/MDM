
import React from 'react';
import { Notification } from '../../types';
import Button from './Button';

interface NotificationPanelProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onAction: (notification: Notification) => void;
  onClose: () => void;
}

const WarningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 dark:text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-500 dark:text-sky-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>;
const SetupIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-500 dark:text-teal-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>;

const NotificationIcon: React.FC<{ type: Notification['type'] }> = ({ type }) => {
    switch (type) {
        case 'warning': return <WarningIcon />;
        case 'info': return <InfoIcon />;
        case 'setup': return <SetupIcon />;
        default: return <InfoIcon />;
    }
};

const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onDismiss, onDismissAll, onAction, onClose }) => {
  
  const handleActionClick = (notification: Notification) => {
    onAction(notification);
    onClose();
  };

  const handleDismissAll = () => {
    onDismissAll();
    onClose();
  }

  return (
    <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Notifications</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="p-2 max-h-80 overflow-y-auto flex-grow">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 p-6 text-center">No new notifications.</p>
        ) : (
          <ul className="space-y-1">
            {notifications.map(notification => (
              <li key={notification.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 pt-0.5">
                        <NotificationIcon type={notification.type} />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                             <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 pr-2">{notification.title}</h4>
                             <button onClick={() => onDismiss(notification.id)} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors rounded-full p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 flex-shrink-0 -mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notification.message}</p>
                        <Button 
                            onClick={() => handleActionClick(notification)} 
                            className="w-full mt-3 !py-1.5 !text-xs font-medium" 
                            variant="secondary"
                        >
                            {notification.actionLabel}
                        </Button>
                    </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {notifications.length > 0 && (
          <div className="p-2 border-t border-slate-100 dark:border-slate-800/60 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <button onClick={handleDismissAll} className="w-full text-center text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 py-2 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors">
                  Dismiss All
              </button>
          </div>
      )}
    </div>
  );
};

export default NotificationPanel;
