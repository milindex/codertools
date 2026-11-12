'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';

type Theme = 'dark' | 'light';

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    const current =
      document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ct-theme', next);
    setTheme(next);
  };

  return (
    <Button
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      className="text-fg-muted transition-transform hover:rotate-12"
      onClick={toggle}
      size="icon"
      variant="ghost"
    >
      {theme === 'dark' ? (
        <Sun aria-hidden className="h-4 w-4" />
      ) : (
        <Moon aria-hidden className="h-4 w-4" />
      )}
    </Button>
  );
};
