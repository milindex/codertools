import { LoaderCircle } from 'lucide-react';

import { cn } from '@/utils/cn';

export const Spinner = ({ className }: { className?: string }) => (
  <LoaderCircle
    aria-hidden
    className={cn('h-4 w-4 animate-spin text-fg-muted', className)}
  />
);
