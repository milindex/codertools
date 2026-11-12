'use client';

import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';

import { ToolErrorBoundary } from '@/components/tools/ToolErrorBoundary';
import type { CategoryModule } from '@/components/tools/types';
import { Callout } from '@/components/ui/Callout';
import { Panel } from '@/components/ui/Panel';
import { Spinner } from '@/components/ui/Spinner';

const loaders: Record<string, () => Promise<CategoryModule>> = {
  html: () => import('@/tools/html'),
  css: () => import('@/tools/css'),
  js: () => import('@/tools/js'),
  json: () => import('@/tools/json'),
  encoding: () => import('@/tools/encoding'),
  crypto: () => import('@/tools/crypto'),
  auth: () => import('@/tools/auth'),
  generators: () => import('@/tools/generators'),
  text: () => import('@/tools/text'),
  data: () => import('@/tools/data'),
  code: () => import('@/tools/code'),
  color: () => import('@/tools/color'),
  math: () => import('@/tools/math'),
  time: () => import('@/tools/time'),
  web: () => import('@/tools/web'),
  images: () => import('@/tools/images'),
  validators: () => import('@/tools/validators'),
  productivity: () => import('@/tools/productivity'),
};

type ToolRendererProps = {
  category: string;
  tool: string;
};

export const ToolRenderer = ({ category, tool }: ToolRendererProps) => {
  const [Component, setComponent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setComponent(null);
    setError(null);

    const loader = loaders[category];
    if (!loader) {
      setError('Unknown tool category.');
      return () => {
        active = false;
      };
    }

    loader()
      .then((module) => {
        if (!active) {
          return;
        }
        const resolved = module.components[tool];
        if (!resolved) {
          setError('This tool is being implemented.');
          return;
        }
        setComponent(() => resolved);
      })
      .catch(() => {
        if (active) {
          setError('The tool could not be loaded. Please refresh the page.');
        }
      });

    return () => {
      active = false;
    };
  }, [category, tool]);

  if (error) {
    return (
      <Callout title="Tool unavailable" variant="warning">
        {error}
      </Callout>
    );
  }

  if (!Component) {
    return (
      <Panel>
        <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-fg-muted">
          <Spinner />
          Loading tool…
        </div>
      </Panel>
    );
  }

  return (
    <ToolErrorBoundary>
      <Component />
    </ToolErrorBoundary>
  );
};
