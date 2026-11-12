'use client';

import { useMemo, useState } from 'react';

import { Callout } from '@/components/ui/Callout';
import { CopyButton } from '@/components/ui/CopyButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type Mode = 'parse' | 'build';

type CookieRow = {
  name: string;
  value: string;
  decoded: string | null;
};

const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;

export default function CookieParserTool() {
  const [mode, setMode] = useState<Mode>('parse');
  const [cookieInput, setCookieInput] = useState('');

  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [path, setPath] = useState('/');
  const [domain, setDomain] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [expires, setExpires] = useState('');
  const [secure, setSecure] = useState(false);
  const [httpOnly, setHttpOnly] = useState(false);
  const [sameSite, setSameSite] = useState('Lax');

  const parsed = useMemo<{ rows: CookieRow[]; error: string | null }>(() => {
    const source = cookieInput.trim();
    if (!source) {
      return { rows: [], error: null };
    }

    const rows: CookieRow[] = [];
    for (const part of source.split(';')) {
      const segment = part.trim();
      if (!segment) {
        continue;
      }
      const equals = segment.indexOf('=');
      const rowName = (
        equals === -1 ? segment : segment.slice(0, equals)
      ).trim();
      const rowValue = equals === -1 ? '' : segment.slice(equals + 1).trim();
      if (!rowName) {
        continue;
      }
      let decoded: string | null = null;
      try {
        decoded = decodeURIComponent(rowValue);
      } catch {
        decoded = null;
      }
      rows.push({ name: rowName, value: rowValue, decoded });
    }

    if (rows.length === 0) {
      return {
        rows,
        error: 'No cookie name/value pairs were found in that header.',
      };
    }
    return { rows, error: null };
  }, [cookieInput]);

  const hasEncodedValues = parsed.rows.some(
    (row) => row.decoded !== null && row.decoded !== row.value
  );

  const rebuiltCookie = parsed.rows
    .map((row) => `${row.name}=${row.value}`)
    .join('; ');

  const built = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name.trim()) {
      return { value: '', error: null, warnings };
    }

    if (!COOKIE_NAME.test(name.trim())) {
      errors.push(
        "Cookie names can only contain letters, digits and the characters !#$%&'*+-.^_`|~ ."
      );
    }
    if (/[;\r\n]/.test(value)) {
      errors.push('Cookie values cannot contain semicolons or line breaks.');
    }

    let expiresUtc = '';
    if (expires) {
      const date = new Date(expires);
      if (Number.isNaN(date.getTime())) {
        errors.push('Expires is not a valid date.');
      } else {
        expiresUtc = date.toUTCString();
      }
    }

    const trimmedMaxAge = maxAge.trim();
    if (trimmedMaxAge && !/^-?\d+$/.test(trimmedMaxAge)) {
      errors.push('Max-Age must be a whole number of seconds.');
    }

    if (sameSite === 'None' && !secure) {
      warnings.push(
        'SameSite=None requires the Secure flag in modern browsers.'
      );
    }

    if (errors.length > 0) {
      return { value: '', error: errors.join(' '), warnings };
    }

    const parts = [`${name.trim()}=${value}`];
    if (path.trim()) {
      parts.push(`Path=${path.trim()}`);
    }
    if (domain.trim()) {
      parts.push(`Domain=${domain.trim()}`);
    }
    if (trimmedMaxAge) {
      parts.push(`Max-Age=${trimmedMaxAge}`);
    }
    if (expiresUtc) {
      parts.push(`Expires=${expiresUtc}`);
    }
    if (secure) {
      parts.push('Secure');
    }
    if (httpOnly) {
      parts.push('HttpOnly');
    }
    if (sameSite) {
      parts.push(`SameSite=${sameSite}`);
    }

    return {
      value: `Set-Cookie: ${parts.join('; ')}`,
      error: null,
      warnings,
    };
  }, [name, value, path, domain, maxAge, expires, secure, httpOnly, sameSite]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Parse a Cookie request header or build a Set-Cookie response header."
          title={mode === 'parse' ? 'Cookie header' : 'Cookie attributes'}
        >
          <Field label="Mode">
            <SegmentedControl
              ariaLabel="Cookie mode"
              onChange={(next) => setMode(next as Mode)}
              options={[
                { value: 'parse', label: 'Parse header' },
                { value: 'build', label: 'Build Set-Cookie' },
              ]}
              value={mode}
            />
          </Field>

          {mode === 'parse' ? (
            <Field
              className="mt-3"
              hint={`${cookieInput.length.toLocaleString()} characters`}
              label="Cookie header"
            >
              <Textarea
                aria-label="Cookie header"
                className="min-h-[180px]"
                onChange={(event) => setCookieInput(event.target.value)}
                placeholder="session=abc123; theme=dark; lang=en-US"
                value={cookieInput}
              />
            </Field>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <Input
                    aria-label="Cookie name"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="session"
                    type="text"
                    value={name}
                  />
                </Field>
                <Field label="Value">
                  <Input
                    aria-label="Cookie value"
                    onChange={(event) => setValue(event.target.value)}
                    placeholder="abc123"
                    type="text"
                    value={value}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Path">
                  <Input
                    aria-label="Cookie path"
                    onChange={(event) => setPath(event.target.value)}
                    placeholder="/"
                    type="text"
                    value={path}
                  />
                </Field>
                <Field label="Domain">
                  <Input
                    aria-label="Cookie domain"
                    onChange={(event) => setDomain(event.target.value)}
                    placeholder="example.com"
                    type="text"
                    value={domain}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field hint="Seconds" label="Max-Age">
                  <Input
                    aria-label="Cookie Max-Age"
                    inputMode="numeric"
                    onChange={(event) => setMaxAge(event.target.value)}
                    placeholder="3600"
                    type="text"
                    value={maxAge}
                  />
                </Field>
                <Field hint="Converted to GMT" label="Expires">
                  <Input
                    aria-label="Cookie expiry"
                    onChange={(event) => setExpires(event.target.value)}
                    type="datetime-local"
                    value={expires}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="SameSite">
                  <Select
                    aria-label="Cookie SameSite"
                    onChange={(event) => setSameSite(event.target.value)}
                    value={sameSite}
                  >
                    <option value="">Not set</option>
                    <option value="Lax">Lax</option>
                    <option value="Strict">Strict</option>
                    <option value="None">None</option>
                  </Select>
                </Field>

                <div className="flex items-end gap-5 pb-1">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-fg">
                    <input
                      checked={secure}
                      className="h-4 w-4"
                      onChange={(event) => setSecure(event.target.checked)}
                      type="checkbox"
                    />
                    Secure
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-fg">
                    <input
                      checked={httpOnly}
                      className="h-4 w-4"
                      onChange={(event) => setHttpOnly(event.target.checked)}
                      type="checkbox"
                    />
                    HttpOnly
                  </label>
                </div>
              </div>

              <p className="text-xs leading-5 text-fg-muted">
                Values are written as-is. Encode special characters
                (encodeURIComponent) before adding them if your server expects
                URL-encoded cookies.
              </p>

              {built.warnings.length > 0 && (
                <Callout variant="warning">{built.warnings.join(' ')}</Callout>
              )}
            </div>
          )}
        </Panel>

        <ResultPanel
          emptyText={
            mode === 'parse'
              ? 'Paste a Cookie header to see its name/value pairs.'
              : 'Enter a cookie name to build a Set-Cookie header.'
          }
          error={mode === 'parse' ? parsed.error : built.error}
          filename="cookies.txt"
          label={mode === 'parse' ? 'Parsed cookies' : 'Set-Cookie header'}
          value={mode === 'parse' ? rebuiltCookie : built.value}
        >
          {mode === 'parse' && parsed.rows.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-fg-muted">
                  {parsed.rows.length}{' '}
                  {parsed.rows.length === 1 ? 'cookie' : 'cookies'}
                </span>
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-left text-xs">
                  <thead className="bg-canvas-subtle/60 text-[11px] uppercase tracking-wide text-fg-muted">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Name</th>
                      <th className="px-3 py-2 font-semibold">Value</th>
                      {hasEncodedValues && (
                        <th className="px-3 py-2 font-semibold">Decoded</th>
                      )}
                      <th className="px-3 py-2 font-semibold">
                        <span className="sr-only">Copy</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsed.rows.map((row, index) => (
                      <tr key={`${row.name}-${index}`}>
                        <td className="px-3 py-2 font-mono font-semibold text-fg">
                          {row.name}
                        </td>
                        <td className="break-all px-3 py-2 font-mono text-fg-muted">
                          {row.value || '—'}
                        </td>
                        {hasEncodedValues && (
                          <td className="break-all px-3 py-2 font-mono text-fg-muted">
                            {row.decoded ?? 'Invalid encoding'}
                          </td>
                        )}
                        <td className="px-1 py-1 text-right">
                          <CopyButton value={`${row.name}=${row.value}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Callout variant="info">
                Cookies with duplicate names can exist with different paths or
                domains. The order above follows the header.
              </Callout>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
