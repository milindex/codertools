import type { ReactNode } from 'react';

import { cn } from '@/utils/cn';

type ToolLayoutProps = {
  children: ReactNode;
  className?: string;
};

export const ToolLayout = ({ children, className }: ToolLayoutProps) => (
  <div className={cn('grid gap-6 lg:grid-cols-2', className)}>{children}</div>
);
