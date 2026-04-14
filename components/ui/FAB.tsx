import React from 'react';

interface FABProps {
  onClick: () => void;
  icon: React.ReactElement;
  ariaLabel: string;
}

const FAB: React.FC<FABProps> = ({ onClick, icon, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-950 transition-all transform active:scale-95 flex items-center justify-center"
    >
      {icon}
    </button>
  );
};

export default FAB;
