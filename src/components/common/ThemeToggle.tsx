import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-1">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
          theme === 'light' 
            ? 'bg-zinc-800 text-emerald-400 shadow-sm' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
        }`}
        title="Light Mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
          theme === 'dark' 
            ? 'bg-zinc-800 text-emerald-400 shadow-sm' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
          theme === 'system' 
            ? 'bg-zinc-800 text-emerald-400 shadow-sm' 
            : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
        }`}
        title="System Theme"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  );
};
