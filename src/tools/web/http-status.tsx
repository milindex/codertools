'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

type StatusCode = {
  code: number;
  name: string;
  description: string;
};

type StatusGroup = '1' | '2' | '3' | '4' | '5';

const STATUS_CODES: StatusCode[] = [
  {
    code: 100,
    name: 'Continue',
    description:
      'The server received the request headers and the client should continue sending the body.',
  },
  {
    code: 101,
    name: 'Switching Protocols',
    description:
      'The server is switching to a protocol requested by the client, such as WebSocket.',
  },
  {
    code: 102,
    name: 'Processing',
    description:
      'The server is processing the request but no response is available yet (WebDAV).',
  },
  {
    code: 103,
    name: 'Early Hints',
    description:
      'Hints to preload resources while the server prepares the final response.',
  },
  {
    code: 200,
    name: 'OK',
    description:
      'The request succeeded and the response body contains the result.',
  },
  {
    code: 201,
    name: 'Created',
    description: 'The request succeeded and a new resource was created.',
  },
  {
    code: 202,
    name: 'Accepted',
    description:
      'The request was accepted for processing, but processing is not complete.',
  },
  {
    code: 203,
    name: 'Non-Authoritative Information',
    description:
      'The returned metadata is from a local or third-party copy, not the origin server.',
  },
  {
    code: 204,
    name: 'No Content',
    description: 'The request succeeded but there is no content to return.',
  },
  {
    code: 205,
    name: 'Reset Content',
    description:
      'The client should reset the document view that submitted the request.',
  },
  {
    code: 206,
    name: 'Partial Content',
    description:
      'The server is returning part of the resource, usually for range requests.',
  },
  {
    code: 207,
    name: 'Multi-Status',
    description:
      'Multiple independent status codes are returned for a batch of operations (WebDAV).',
  },
  {
    code: 208,
    name: 'Already Reported',
    description:
      'Members of a binding were already enumerated in an earlier response (WebDAV).',
  },
  {
    code: 226,
    name: 'IM Used',
    description:
      'The server applied one or more instance manipulations to the resource.',
  },
  {
    code: 300,
    name: 'Multiple Choices',
    description:
      'The request has more than one possible response; the client should choose one.',
  },
  {
    code: 301,
    name: 'Moved Permanently',
    description:
      'The resource has permanently moved to the URL in the Location header.',
  },
  {
    code: 302,
    name: 'Found',
    description: 'The resource is temporarily available at a different URL.',
  },
  {
    code: 303,
    name: 'See Other',
    description:
      'The client should retrieve the resource with a GET request at the Location URL.',
  },
  {
    code: 304,
    name: 'Not Modified',
    description:
      'The cached representation is still valid, so no body is sent.',
  },
  {
    code: 305,
    name: 'Use Proxy',
    description:
      'The resource must be accessed through the proxy in the Location header (deprecated).',
  },
  {
    code: 307,
    name: 'Temporary Redirect',
    description:
      'The resource is temporarily at another URL and the method must not change.',
  },
  {
    code: 308,
    name: 'Permanent Redirect',
    description:
      'The resource moved permanently and the request method must not change.',
  },
  {
    code: 400,
    name: 'Bad Request',
    description:
      'The server cannot process the request because of client-side syntax or validation errors.',
  },
  {
    code: 401,
    name: 'Unauthorized',
    description:
      'Authentication is required, or the supplied credentials are invalid.',
  },
  {
    code: 402,
    name: 'Payment Required',
    description:
      'Reserved for future use; often used by paid APIs for billing problems.',
  },
  {
    code: 403,
    name: 'Forbidden',
    description:
      'The server understood the request but refuses to authorize it.',
  },
  {
    code: 404,
    name: 'Not Found',
    description:
      'The requested resource does not exist or is intentionally hidden.',
  },
  {
    code: 405,
    name: 'Method Not Allowed',
    description: 'The request method is not supported for this resource.',
  },
  {
    code: 406,
    name: 'Not Acceptable',
    description:
      'The server cannot produce a response matching the Accept headers.',
  },
  {
    code: 407,
    name: 'Proxy Authentication Required',
    description: 'The client must authenticate with the proxy first.',
  },
  {
    code: 408,
    name: 'Request Timeout',
    description:
      'The server timed out waiting for the client to finish the request.',
  },
  {
    code: 409,
    name: 'Conflict',
    description:
      'The request conflicts with the current state of the resource.',
  },
  {
    code: 410,
    name: 'Gone',
    description:
      'The resource is permanently gone and no forwarding address is available.',
  },
  {
    code: 411,
    name: 'Length Required',
    description: 'The request must include a valid Content-Length header.',
  },
  {
    code: 412,
    name: 'Precondition Failed',
    description:
      'A conditional request header evaluated to false on the server.',
  },
  {
    code: 413,
    name: 'Content Too Large',
    description:
      'The request body is larger than the server is willing to process.',
  },
  {
    code: 414,
    name: 'URI Too Long',
    description:
      'The request target is longer than the server is willing to interpret.',
  },
  {
    code: 415,
    name: 'Unsupported Media Type',
    description: 'The request body format is not supported by the resource.',
  },
  {
    code: 416,
    name: 'Range Not Satisfiable',
    description: 'The requested byte range cannot be satisfied.',
  },
  {
    code: 417,
    name: 'Expectation Failed',
    description:
      'The server cannot meet the requirements of the Expect header.',
  },
  {
    code: 418,
    name: "I'm a teapot",
    description:
      'An April Fools status code from RFC 2324; the server is a teapot.',
  },
  {
    code: 421,
    name: 'Misdirected Request',
    description:
      'The request was sent to a server that cannot produce a response for this origin.',
  },
  {
    code: 422,
    name: 'Unprocessable Content',
    description: 'The request is well formed but contains semantic errors.',
  },
  {
    code: 423,
    name: 'Locked',
    description: 'The resource is locked (WebDAV).',
  },
  {
    code: 424,
    name: 'Failed Dependency',
    description:
      'The request failed because a dependent request failed (WebDAV).',
  },
  {
    code: 425,
    name: 'Too Early',
    description:
      'The server refuses to process a replayable request that may be replayed.',
  },
  {
    code: 426,
    name: 'Upgrade Required',
    description: 'The client must switch to a different protocol, such as TLS.',
  },
  {
    code: 428,
    name: 'Precondition Required',
    description:
      'The server requires the request to be conditional to avoid lost updates.',
  },
  {
    code: 429,
    name: 'Too Many Requests',
    description:
      'The client has sent too many requests in a given time window.',
  },
  {
    code: 431,
    name: 'Request Header Fields Too Large',
    description: 'The request headers exceed the server limit.',
  },
  {
    code: 451,
    name: 'Unavailable For Legal Reasons',
    description: 'The resource cannot be served because of legal requirements.',
  },
  {
    code: 500,
    name: 'Internal Server Error',
    description:
      'The server encountered an unexpected condition and could not complete the request.',
  },
  {
    code: 501,
    name: 'Not Implemented',
    description:
      'The server does not support the functionality required to fulfill the request.',
  },
  {
    code: 502,
    name: 'Bad Gateway',
    description:
      'The server received an invalid response from an upstream server.',
  },
  {
    code: 503,
    name: 'Service Unavailable',
    description:
      'The server is overloaded or down for maintenance; try again later.',
  },
  {
    code: 504,
    name: 'Gateway Timeout',
    description: 'An upstream server did not respond in time.',
  },
  {
    code: 505,
    name: 'HTTP Version Not Supported',
    description:
      'The server does not support the HTTP version used in the request.',
  },
  {
    code: 506,
    name: 'Variant Also Negotiates',
    description:
      'The server has an internal configuration error during content negotiation.',
  },
  {
    code: 507,
    name: 'Insufficient Storage',
    description:
      'The server cannot store the representation needed to complete the request (WebDAV).',
  },
  {
    code: 508,
    name: 'Loop Detected',
    description:
      'The server detected an infinite loop while processing the request (WebDAV).',
  },
  {
    code: 510,
    name: 'Not Extended',
    description:
      'The server requires further extensions to fulfill the request.',
  },
  {
    code: 511,
    name: 'Network Authentication Required',
    description:
      'The client must authenticate to gain network access, such as a captive portal.',
  },
];

const GROUP_LABELS: Record<StatusGroup, string> = {
  '1': '1xx Informational',
  '2': '2xx Success',
  '3': '3xx Redirection',
  '4': '4xx Client error',
  '5': '5xx Server error',
};

const GROUP_BADGES: Record<
  StatusGroup,
  'default' | 'accent' | 'success' | 'warning' | 'danger'
> = {
  '1': 'default',
  '2': 'success',
  '3': 'accent',
  '4': 'warning',
  '5': 'danger',
};

const groupOf = (code: number): StatusGroup =>
  String(Math.floor(code / 100)) as StatusGroup;

export default function HttpStatusTool() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'all' | StatusGroup>('all');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return STATUS_CODES.filter((item) => {
      if (group !== 'all' && groupOf(item.code) !== group) {
        return false;
      }
      if (!term) {
        return true;
      }
      return (
        String(item.code).includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    });
  }, [group, query]);

  const groups = useMemo(() => {
    const result = new Map<StatusGroup, StatusCode[]>();
    for (const item of filtered) {
      const key = groupOf(item.code);
      const list = result.get(key) ?? [];
      list.push(item);
      result.set(key, list);
    }
    return [...result.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const text = filtered
    .map((item) => `${item.code} ${item.name}\n${item.description}`)
    .join('\n\n');

  return (
    <ToolLayout>
      <Panel
        description="Search by code, name or description, then narrow the list by response class."
        title="Find a status code"
      >
        <div className="space-y-3">
          <Input
            aria-label="Search status codes"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search 404, redirect, gateway…"
            type="search"
            value={query}
          />

          <SegmentedControl
            ariaLabel="Filter by status class"
            onChange={(value) => setGroup(value as 'all' | StatusGroup)}
            options={[
              { value: 'all', label: 'All' },
              { value: '1', label: '1xx' },
              { value: '2', label: '2xx' },
              { value: '3', label: '3xx' },
              { value: '4', label: '4xx' },
              { value: '5', label: '5xx' },
            ]}
            value={group}
          />

          <div className="flex flex-wrap gap-1.5">
            {(['1', '2', '3', '4', '5'] as StatusGroup[]).map((key) => (
              <Badge key={key} variant={GROUP_BADGES[key]}>
                {key}xx ·{' '}
                {
                  STATUS_CODES.filter((item) => groupOf(item.code) === key)
                    .length
                }
              </Badge>
            ))}
          </div>

          <p className="text-xs leading-5 text-fg-muted">
            {filtered.length} of {STATUS_CODES.length} codes shown. Codes follow
            the IANA HTTP status code registry.
          </p>
        </div>
      </Panel>

      <ResultPanel
        label={`${filtered.length} status code${filtered.length === 1 ? '' : 's'}`}
        value={text}
      >
        {groups.length === 0 ? (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            No status codes match that search.
          </div>
        ) : (
          <div className="max-h-[520px] space-y-4 overflow-auto">
            {groups.map(([key, items]) => (
              <section key={key}>
                <h3 className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  <Badge variant={GROUP_BADGES[key]}>{key}xx</Badge>
                  {GROUP_LABELS[key]}
                </h3>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-canvas-subtle/60 text-[11px] uppercase tracking-wide text-fg-muted">
                      <tr>
                        <th className="w-16 px-3 py-1.5 font-semibold">Code</th>
                        <th className="w-52 px-3 py-1.5 font-semibold">Name</th>
                        <th className="px-3 py-1.5 font-semibold">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          className="border-t border-border align-top"
                          key={item.code}
                        >
                          <td className="px-3 py-2 font-mono text-[12px] font-semibold text-accent">
                            {item.code}
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-fg">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 text-xs leading-5 text-fg-muted">
                            {item.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
