import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

export const Container = ({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) => (
  <div
    className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}
    id={id}
  >
    {children}
  </div>
);
