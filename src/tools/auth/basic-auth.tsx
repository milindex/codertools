'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { bytesToBase64, textEncoder } from '@/tools/auth/_utils';

export default function BasicAuthTool() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const result = useMemo(() => {
    if (!username && !password) {
      return { header: '', token: '', error: null as string | null };
    }
    try {
      const token = bytesToBase64(
        textEncoder.encode(`${username}:${password}`)
      );
      return { header: `Authorization: Basic ${token}`, token, error: null };
    } catch (cause) {
      return {
        header: '',
        token: '',
        error:
          cause instanceof Error
            ? cause.message
            : 'The credentials could not be encoded.',
      };
    }
  }, [username, password]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="HTTP Basic authentication sends the username and password encoded with base64 in a request header."
          title="Credentials"
        >
          <div className="space-y-3">
            <Field
              hint={`${username.length.toLocaleString()} characters`}
              label="Username"
            >
              <Input
                aria-label="Username"
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="user@example.com"
                type="text"
                value={username}
              />
            </Field>

            <Field
              hint={`${password.length.toLocaleString()} characters`}
              label="Password"
            >
              <Input
                aria-label="Password"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter the password…"
                type="password"
                value={password}
              />
            </Field>
          </div>

          <p className="mt-3 text-xs leading-5 text-fg-muted">
            The username and password are encoded as UTF-8 before base64
            encoding. Base64 is not encryption.
          </p>

          <Callout className="mt-4" variant="warning">
            Only use Basic authentication over HTTPS. Anyone who sees the header
            can decode the credentials.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Enter a username or password to build the header."
          error={result.error}
          filename="authorization.txt"
          label="Authorization header"
          value={result.header}
        >
          {result.header ? (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Header
                  </span>
                  <CopyButton value={result.header} />
                </div>
                <pre className="overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[13px] leading-6 text-fg">
                  {result.header}
                </pre>
              </div>

              <div className="overflow-hidden rounded-md border border-border bg-canvas-inset">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                    Base64 token
                  </span>
                  <CopyButton value={result.token} />
                </div>
                <pre className="overflow-auto whitespace-pre-wrap break-all p-3 font-mono text-[13px] leading-6 text-fg">
                  {result.token}
                </pre>
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
