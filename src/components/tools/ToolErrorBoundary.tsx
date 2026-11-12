'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

import { Callout } from '@/components/ui/Callout';

type ToolErrorBoundaryProps = {
  children: ReactNode;
};

type ToolErrorBoundaryState = {
  error: Error | null;
};

export class ToolErrorBoundary extends Component<
  ToolErrorBoundaryProps,
  ToolErrorBoundaryState
> {
  state: ToolErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ToolErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the error in the console for debugging without crashing the page.
    console.error('Tool crashed', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Callout title="This tool hit an unexpected error" variant="error">
          Refresh the page and try again. If the problem persists, the tool may
          not support this browser or input.
        </Callout>
      );
    }

    return this.props.children;
  }
}
