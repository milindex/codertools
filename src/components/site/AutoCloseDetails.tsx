'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

type AutoCloseDetailsProps = {
  children: ReactNode;
  className?: string;
};

export const AutoCloseDetails = ({
  children,
  className,
}: AutoCloseDetailsProps) => {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) {
      ref.current.open = false;
    }
  }, [pathname]);

  useEffect(() => {
    const close = () => {
      if (ref.current) {
        ref.current.open = false;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    const onClick = (event: MouseEvent) => {
      if (ref.current && (event.target as HTMLElement).closest('a')) {
        close();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <details className={className} ref={ref}>
      {children}
    </details>
  );
};
