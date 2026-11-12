'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { errorMessage } from './_shared';

const EXAMPLE = `query UserWithPosts($id: ID!) {
  user(id: $id) {
    id
    name
    posts(first: 10) { edges { node { id title } } }
  }
}

type Post { id: ID! title: String! author: User! }`;

export default function GraphqlFormatterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const formatDocument = async () => {
    if (!input.trim()) {
      setOutput('');
      setError('Paste a GraphQL schema or query to format.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const graphqlModule = await import('graphql');
      const fallbackModule = (
        graphqlModule as unknown as {
          default?: {
            parse?: typeof graphqlModule.parse;
            print?: typeof graphqlModule.print;
          };
        }
      ).default;
      const parse = graphqlModule.parse ?? fallbackModule?.parse;
      const print = graphqlModule.print ?? fallbackModule?.print;

      if (typeof parse !== 'function' || typeof print !== 'function') {
        throw new Error('The GraphQL parser could not be loaded.');
      }

      const document = parse(input);
      setOutput(print(document));
    } catch (formatError) {
      const graphqlError = formatError as {
        message?: string;
        locations?: Array<{ line: number; column: number }>;
      };
      const location = graphqlError.locations?.[0];
      const baseMessage =
        typeof graphqlError.message === 'string'
          ? graphqlError.message
          : errorMessage(formatError);
      setOutput('');
      setError(
        location
          ? `${baseMessage} (line ${location.line}, column ${location.column})`
          : baseMessage
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolLayout>
      <Panel
        description="Supports executable documents (queries, mutations, subscriptions, fragments) and SDL type-system definitions."
        title="GraphQL input"
      >
        <Field
          hint={`${input.length.toLocaleString()} characters`}
          label="Schema or document"
        >
          <Textarea
            aria-label="GraphQL schema or document"
            className="min-h-[340px]"
            onChange={(event) => {
              setInput(event.target.value);
              setError(null);
            }}
            placeholder={EXAMPLE}
            value={input}
          />
        </Field>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={busy} onClick={formatDocument} variant="primary">
            {busy && <Spinner className="h-3.5 w-3.5" />}
            Format GraphQL
          </Button>
          <Button onClick={() => setInput(EXAMPLE)}>Load example</Button>
          <Button
            onClick={() => {
              setInput('');
              setOutput('');
              setError(null);
            }}
            variant="ghost"
          >
            Clear
          </Button>
        </div>

        {error && (
          <Callout className="mt-3" title="Invalid GraphQL" variant="error">
            {error}
          </Callout>
        )}

        <Callout className="mt-3" variant="info">
          GraphQL comments are not part of the GraphQL syntax tree, so they are
          removed by the formatter. String literals and descriptions are kept.
        </Callout>
      </Panel>

      <ResultPanel
        emptyText="Formatted GraphQL will appear here."
        filename="document.graphql"
        label="Formatted GraphQL"
        value={output}
      />
    </ToolLayout>
  );
}
