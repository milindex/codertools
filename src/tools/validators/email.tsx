'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

type EmailAnalysis = {
  valid: boolean;
  normalized: string;
  local: string;
  domain: string;
  asciiDomain: string;
  errors: string[];
  warnings: string[];
  quotedLocal: boolean;
  ipLiteral: boolean;
};

const DOT_ATOM = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const IPV4 =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

const domainToAscii = (domain: string): string | null => {
  try {
    const hostname = new URL(`http://${domain}`).hostname;
    return hostname.replace(/\.$/, '').toLowerCase() || null;
  } catch {
    return null;
  }
};

const validateQuotedLocal = (local: string): string | null => {
  const inner = local.slice(1, -1);
  let escaped = false;

  for (const character of inner) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\') {
      escaped = true;
      continue;
    }
    if (character === '"') {
      return 'The quoted local part contains an unescaped double quote.';
    }
    if (character === '\r' || character === '\n') {
      return 'Line breaks are not allowed inside a quoted local part.';
    }
  }

  if (escaped) {
    return 'The quoted local part ends with an incomplete escape sequence.';
  }
  return null;
};

const analyzeEmail = (raw: string): EmailAnalysis => {
  const input = raw.trim();
  const errors: string[] = [];
  const warnings: string[] = [];
  const firstAt = input.indexOf('@');
  const lastAt = input.lastIndexOf('@');
  const local = firstAt >= 0 ? input.slice(0, firstAt) : input;
  const domain = lastAt >= 0 ? input.slice(lastAt + 1) : '';
  const quotedLocal =
    local.length >= 2 && local.startsWith('"') && local.endsWith('"');

  if (quotedLocal && local.length === 2) {
    errors.push('The quoted local part is empty.');
  }

  if (input.length > 254) {
    errors.push(
      `The full address is ${input.length} characters long; SMTP limits it to 254.`
    );
  }

  if (firstAt === -1) {
    errors.push(
      'The address is missing an @ separator between the local part and the domain.'
    );
  } else if (firstAt !== lastAt) {
    errors.push(
      'The address contains more than one @. Only the final @ may separate the local part from the domain.'
    );
  }

  if (firstAt === 0) {
    errors.push('The local part (before the @) is empty.');
  } else if (firstAt === input.length - 1) {
    errors.push('The domain (after the @) is empty.');
  }

  if (local.length > 64) {
    errors.push(
      `The local part is ${local.length} characters long; the maximum is 64.`
    );
  }

  if (!quotedLocal) {
    if (/[\s]/.test(local)) {
      errors.push('Spaces and tabs are not allowed in an unquoted local part.');
    }
    if (!DOT_ATOM.test(local) && local.length > 0) {
      errors.push(
        "The local part may only contain ASCII letters, digits and the special characters ! # $ % & ' * + / = ? ^ _ ` { | } ~ . -"
      );
    }
    if (local.startsWith('.') || local.endsWith('.')) {
      errors.push('The local part cannot start or end with a dot.');
    }
    if (local.includes('..')) {
      errors.push('The local part cannot contain two consecutive dots.');
    }
  } else {
    const quotedError = validateQuotedLocal(local);
    if (quotedError) {
      errors.push(quotedError);
    }
    warnings.push(
      'Quoted local parts are legal in the email specification, but many sign-up forms reject them.'
    );
  }

  let asciiDomain = '';
  let ipLiteral = false;

  if (domain.startsWith('[') && domain.endsWith(']')) {
    ipLiteral = true;
    const literal = domain.slice(1, -1).replace(/^IPv6:/i, '');
    let literalValid = false;

    if (IPV4.test(literal)) {
      literalValid = true;
    } else if (/^[0-9a-f:]+$/i.test(literal) && literal.includes(':')) {
      try {
        new URL(`http://[${literal}]`);
        literalValid = true;
      } catch {
        literalValid = false;
      }
    }

    if (literalValid) {
      asciiDomain = domain;
      warnings.push(
        'The domain is an IP address literal. This is valid by specification but is rarely accepted by mailbox providers.'
      );
    } else {
      errors.push(
        'The bracketed domain is not a valid IPv4 or IPv6 address literal.'
      );
    }
  } else if (domain.length > 0) {
    if (/[\s]/.test(domain)) {
      errors.push('The domain cannot contain spaces or tabs.');
    }
    if (/[/\\?:#@[\]]/.test(domain)) {
      errors.push(
        'The domain contains a character that is not allowed in a hostname (such as / \\ : ? # @ [ ]).'
      );
    }
    if (domain.startsWith('.') || domain.endsWith('.')) {
      errors.push('The domain cannot start or end with a dot.');
    }
    if (domain.includes('..')) {
      errors.push('The domain cannot contain two consecutive dots.');
    }

    const converted = domainToAscii(domain);
    if (!converted) {
      errors.push(
        'The domain could not be converted to a valid DNS name. Check for invalid characters.'
      );
    } else {
      asciiDomain = converted;
      const labels = asciiDomain.split('.');

      if (labels.length < 2) {
        errors.push(
          'The domain must include a dot and a top-level domain, such as example.com.'
        );
      }
      if (asciiDomain.length > 253) {
        errors.push(
          `The domain is ${asciiDomain.length} characters long; DNS limits it to 253.`
        );
      }

      labels.forEach((label) => {
        if (label.length === 0) {
          errors.push('The domain contains an empty label.');
        } else if (label.length > 63) {
          errors.push(
            `The domain label "${label.slice(0, 20)}…" exceeds the 63-character limit.`
          );
        } else if (!LABEL.test(label)) {
          errors.push(
            `"${label}" is not a valid domain label. Labels may only use letters, digits and hyphens, and cannot start or end with a hyphen.`
          );
        }
      });

      const tld = labels[labels.length - 1] ?? '';
      if (tld.length > 0) {
        if (tld.length < 2) {
          errors.push(
            'The top-level domain must be at least two characters long.'
          );
        } else if (/^\d+$/.test(tld)) {
          errors.push('The top-level domain cannot be entirely numeric.');
        } else if (
          !/^[a-z]{2,63}$/i.test(tld) &&
          !/^xn--[a-z0-9-]+$/i.test(tld)
        ) {
          errors.push(
            'The top-level domain must be alphabetic or an internationalized Punycode label.'
          );
        }
      }

      if (asciiDomain !== domain.toLowerCase()) {
        warnings.push(
          `Internationalized domain converted to Punycode for DNS: ${asciiDomain}`
        );
      }
    }
  }

  const uniqueErrors = [...new Set(errors)];
  const normalized =
    local.length > 0 && (asciiDomain.length > 0 || ipLiteral)
      ? `${local}@${asciiDomain}`
      : input;

  return {
    valid: uniqueErrors.length === 0,
    normalized,
    local,
    domain,
    asciiDomain,
    errors: uniqueErrors,
    warnings: [...new Set(warnings)],
    quotedLocal,
    ipLiteral,
  };
};

export default function EmailValidator() {
  const [input, setInput] = useState('');
  const analysis = useMemo(
    () => (input.trim() ? analyzeEmail(input) : null),
    [input]
  );

  return (
    <ToolLayout>
      <Panel
        description="Checks the local part, DNS domain, length limits, dot rules and IDN conversion without sending anything anywhere."
        title="Email address"
      >
        <Field
          hint={`${input.trim().length} characters`}
          label="Address to validate"
        >
          <Input
            aria-label="Email address to validate"
            autoCapitalize="none"
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
            placeholder="name@example.com"
            spellCheck={false}
            type="text"
            value={input}
          />
        </Field>
        <Examples
          items={[
            'dev@example.com',
            'first.last+tag@sub.example.co.uk',
            'user@münchen.de',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Type an email address to see the breakdown."
        label="Validation result"
        value={analysis?.valid ? analysis.normalized : ''}
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={
                analysis.valid ? 'Valid email address' : 'Invalid email address'
              }
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  <span className="font-mono">{analysis.normalized}</span>{' '}
                  passes the practical email checks.
                </span>
              ) : (
                <ReasonList items={analysis.errors} />
              )}
            </Verdict>

            {analysis.warnings.length > 0 && (
              <Callout title="Notes" variant="warning">
                <ReasonList items={analysis.warnings} />
              </Callout>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Badge variant={analysis.valid ? 'success' : 'danger'}>
                {analysis.valid ? 'Passes checks' : 'Has errors'}
              </Badge>
              <Badge>
                {analysis.quotedLocal
                  ? 'Quoted local part'
                  : 'Dot-atom local part'}
              </Badge>
              <Badge>
                {analysis.ipLiteral ? 'IP literal domain' : 'DNS domain'}
              </Badge>
            </div>

            <DetailList
              details={[
                {
                  label: 'Local part',
                  value: (
                    <>
                      <span className="font-mono">{analysis.local || '—'}</span>
                      <span className="ml-2 text-xs text-fg-muted">
                        {analysis.local.length}/64
                      </span>
                    </>
                  ),
                },
                {
                  label: 'Domain',
                  value: (
                    <>
                      <span className="font-mono">
                        {analysis.domain || '—'}
                      </span>
                      <span className="ml-2 text-xs text-fg-muted">
                        {analysis.domain.length}/253
                      </span>
                    </>
                  ),
                  breakAll: true,
                },
                {
                  label: 'Domain (Punycode)',
                  value: analysis.asciiDomain || '—',
                  mono: true,
                  breakAll: true,
                },
                {
                  label: 'Total length',
                  value: `${analysis.normalized.length} / 254 characters`,
                },
              ]}
            />

            <p className="text-xs leading-5 text-fg-muted">
              This validates the address shape, not whether the mailbox exists.
              Delivery can still fail because of DNS, provider policy or a typo
              in the local part.
            </p>
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
