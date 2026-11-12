import { Callout } from '@/components/ui/Callout';

import type { JsonError } from './utils';

type JsonErrorCalloutProps = {
  error: JsonError;
  title?: string;
};

export const JsonErrorCallout = ({
  error,
  title = 'Invalid JSON',
}: JsonErrorCalloutProps) => (
  <div className="space-y-3">
    <Callout title={title} variant="error">
      <p>{error.message}</p>
      {error.line !== undefined && error.column !== undefined && (
        <p className="mt-1 text-xs">
          Line {error.line}, column {error.column}
          {error.position !== undefined ? ` · offset ${error.position}` : ''}
        </p>
      )}
    </Callout>
    {error.snippet && (
      <pre className="overflow-auto rounded-md border border-border bg-canvas-inset p-3 text-[12px] leading-5 text-fg">
        {error.snippet}
      </pre>
    )}
  </div>
);

export default JsonErrorCallout;
