'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { InfoGrid } from './_shared';

const intToOctets = (value: number) => [
  (value >>> 24) & 255,
  (value >>> 16) & 255,
  (value >>> 8) & 255,
  value & 255,
];

const intToIp = (value: number) => intToOctets(value).join('.');

const binary = (value: number) =>
  intToOctets(value)
    .map((octet) => octet.toString(2).padStart(8, '0'))
    .join('.');

const octetsToInt = (octets: number[]) => {
  const [a = 0, b = 0, c = 0, d = 0] = octets;
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
};

type SubnetInfo = {
  ip: string;
  ipInt: number;
  prefix: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  total: number;
  usable: number;
  cidr: string;
  ipBinary: string;
  maskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
  wildcardBinary: string;
  kind: string;
  kindVariant: 'default' | 'accent' | 'success' | 'warning' | 'danger';
};

const classify = (
  octets: number[]
): {
  kind: string;
  variant: 'default' | 'accent' | 'success' | 'warning' | 'danger';
} => {
  const [a = 0, b = 0] = octets;
  if (a === 127) {
    return { kind: 'Loopback', variant: 'warning' };
  }
  if (a === 169 && b === 254) {
    return { kind: 'Link-local', variant: 'warning' };
  }
  if (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  ) {
    return { kind: 'Private (RFC 1918)', variant: 'warning' };
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return { kind: 'Carrier-grade NAT', variant: 'accent' };
  }
  if (a >= 224 && a <= 239) {
    return { kind: 'Multicast', variant: 'danger' };
  }
  if (a >= 240) {
    return { kind: 'Reserved', variant: 'danger' };
  }
  if (a === 0) {
    return { kind: 'This network', variant: 'default' };
  }
  return { kind: 'Public', variant: 'success' };
};

const classifyClass = (firstOctet: number) => {
  if (firstOctet === 0) return 'Class A (reserved)';
  if (firstOctet <= 127) return 'Class A';
  if (firstOctet <= 191) return 'Class B';
  if (firstOctet <= 223) return 'Class C';
  if (firstOctet <= 239) return 'Class D (multicast)';
  return 'Class E (reserved)';
};

const buildSubnet = (
  addressInput: string,
  prefixInput: number
): SubnetInfo | { error: string } => {
  const trimmed = addressInput.trim();
  if (!trimmed) {
    return { error: 'Enter an IPv4 address.' };
  }

  const [addressPart, prefixPart] = trimmed.split('/');
  if (!addressPart) {
    return { error: 'Enter an IPv4 address.' };
  }

  const parts = addressPart.split('.');
  if (parts.length !== 4) {
    return {
      error: 'An IPv4 address must have four octets, for example 192.168.1.10.',
    };
  }

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return { error: `“${part}” is not a valid IPv4 octet.` };
    }
    const value = Number(part);
    if (value > 255) {
      return { error: `The octet “${part}” is greater than 255.` };
    }
    octets.push(value);
  }

  let prefix = prefixInput;
  if (prefixPart !== undefined) {
    if (!/^\d{1,2}$/.test(prefixPart)) {
      return {
        error: 'The CIDR prefix must be a whole number between 0 and 32.',
      };
    }
    prefix = Number(prefixPart);
  }
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return {
      error: 'The CIDR prefix must be a whole number between 0 and 32.',
    };
  }

  const ipInt = octetsToInt(octets);
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcard = ~mask >>> 0;
  const network = (ipInt & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = 2 ** (32 - prefix);
  const usable = prefix >= 31 ? total : total - 2;
  const firstHost = prefix >= 31 ? network : (network + 1) >>> 0;
  const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
  const info = classify(octets);

  return {
    ip: intToIp(ipInt),
    ipInt,
    prefix,
    mask: intToIp(mask),
    wildcard: intToIp(wildcard),
    network: intToIp(network),
    broadcast: intToIp(broadcast),
    firstHost: intToIp(firstHost),
    lastHost: intToIp(lastHost),
    total,
    usable,
    cidr: `${intToIp(network)}/${prefix}`,
    ipBinary: binary(ipInt),
    maskBinary: binary(mask),
    networkBinary: binary(network),
    broadcastBinary: binary(broadcast),
    wildcardBinary: binary(wildcard),
    kind: info.kind,
    kindVariant: info.variant,
  };
};

const formatCount = (value: number) => value.toLocaleString('en-US');

export default function SubnetCalculatorTool() {
  const [address, setAddress] = useState('192.168.1.10');
  const [prefix, setPrefix] = useState(24);

  const info = useMemo(() => buildSubnet(address, prefix), [address, prefix]);
  const data = 'error' in info ? null : info;

  const effectivePrefix = String(prefix);

  const json = data
    ? JSON.stringify(
        {
          ip: data.ip,
          cidr: data.cidr,
          prefix: data.prefix,
          subnetMask: data.mask,
          wildcardMask: data.wildcard,
          network: data.network,
          broadcast: data.broadcast,
          firstHost: data.firstHost,
          lastHost: data.lastHost,
          totalAddresses: data.total,
          usableHosts: data.usable,
          class: classifyClass(Number(data.ip.split('.')[0] ?? 0)),
          type: data.kind,
        },
        null,
        2
      )
    : '';

  return (
    <ToolLayout>
      <Panel
        description="Calculate an IPv4 network from an address and CIDR prefix, including masks, host range and binary breakdown."
        title="IPv4 subnet"
      >
        <div className="space-y-3">
          <Field
            hint={
              address.includes('/')
                ? 'The prefix updates with the address'
                : undefined
            }
            label="IPv4 address or CIDR"
          >
            <Input
              aria-label="IPv4 address or CIDR"
              onChange={(event) => {
                const value = event.target.value;
                setAddress(value);
                const prefixPart = value.split('/')[1];
                if (prefixPart !== undefined && /^\d{1,2}$/.test(prefixPart)) {
                  const parsed = Number(prefixPart);
                  if (parsed >= 0 && parsed <= 32) {
                    setPrefix(parsed);
                  }
                }
              }}
              placeholder="192.168.1.10 or 192.168.1.0/24"
              spellCheck={false}
              value={address}
            />
          </Field>

          <Field
            hint={`Current prefix: /${effectivePrefix}`}
            label="CIDR prefix"
          >
            <Select
              aria-label="CIDR prefix length"
              onChange={(event) => {
                const value = Number(event.target.value);
                setPrefix(value);
                setAddress((current) =>
                  current.includes('/')
                    ? `${current.split('/')[0] ?? ''}/${value}`
                    : current
                );
              }}
              value={prefix}
            >
              {Array.from({ length: 33 }, (_, index) => (
                <option key={index} value={index}>
                  /{index}
                  {index === 8 || index === 16 || index === 24
                    ? ' (common)'
                    : ''}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap gap-1.5">
            {[
              '192.168.1.0/24',
              '10.0.0.0/8',
              '172.16.0.0/12',
              '203.0.113.0/28',
            ].map((example) => (
              <button
                className="cursor-pointer rounded-full border border-border bg-canvas-subtle px-2 py-0.5 text-[11px] font-medium text-fg-muted transition-colors hover:border-accent/50 hover:text-accent"
                key={example}
                onClick={() => setAddress(example)}
                type="button"
              >
                {example}
              </button>
            ))}
          </div>

          {'error' in info && (
            <Callout variant="error" title="Invalid subnet">
              {info.error}
            </Callout>
          )}

          {data && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="accent">{data.cidr}</Badge>
              <Badge variant={data.kindVariant}>{data.kind}</Badge>
              <Badge>{classifyClass(Number(data.ip.split('.')[0] ?? 0))}</Badge>
              {data.prefix === 32 && (
                <Badge variant="success">single host</Badge>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
            Network and broadcast addresses are not usable as hosts except on
            /31 and /32 networks, which follow RFC 3021.
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={'error' in info ? info.error : null}
        filename="subnet.json"
        label="Subnet breakdown"
        mime="application/json"
        value={json}
      >
        {data ? (
          <div className="max-h-[520px] space-y-4 overflow-auto">
            <InfoGrid
              items={[
                { label: 'IP address', value: data.ip },
                { label: 'CIDR notation', value: data.cidr },
                { label: 'Subnet mask', value: data.mask },
                { label: 'Wildcard mask', value: data.wildcard },
                { label: 'Network address', value: data.network },
                { label: 'Broadcast address', value: data.broadcast },
                { label: 'First host', value: data.firstHost },
                { label: 'Last host', value: data.lastHost },
                { label: 'Total addresses', value: formatCount(data.total) },
                { label: 'Usable hosts', value: formatCount(data.usable) },
                { label: 'Address type', value: data.kind },
                {
                  label: 'Class',
                  value: classifyClass(Number(data.ip.split('.')[0] ?? 0)),
                },
              ]}
            />

            <section>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Binary breakdown
              </h3>
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-canvas-subtle/60 text-[11px] uppercase tracking-wide text-fg-muted">
                    <tr>
                      <th className="w-28 px-3 py-1.5 font-semibold">Field</th>
                      <th className="px-3 py-1.5 font-semibold">Binary</th>
                      <th className="px-3 py-1.5 font-semibold">Decimal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        label: 'IP address',
                        bits: data.ipBinary,
                        value: data.ip,
                      },
                      {
                        label: 'Subnet mask',
                        bits: data.maskBinary,
                        value: data.mask,
                      },
                      {
                        label: 'Network',
                        bits: data.networkBinary,
                        value: data.network,
                      },
                      {
                        label: 'Broadcast',
                        bits: data.broadcastBinary,
                        value: data.broadcast,
                      },
                      {
                        label: 'Wildcard',
                        bits: data.wildcardBinary,
                        value: data.wildcard,
                      },
                    ].map((row) => (
                      <tr
                        className="border-t border-border align-top"
                        key={row.label}
                      >
                        <td className="px-3 py-2 text-xs font-medium text-fg-muted">
                          {row.label}
                        </td>
                        <td className="break-all px-3 py-2 font-mono text-[11px] leading-5 text-accent">
                          {row.bits}
                        </td>
                        <td className="px-3 py-2 font-mono text-[12px] text-fg">
                          {row.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-fg-muted">
                Host bits are the trailing zeros in the subnet mask. This
                network has {32 - data.prefix} host bit
                {32 - data.prefix === 1 ? '' : 's'}.
              </p>
            </section>
          </div>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            The subnet mask, network, broadcast and host range will appear here.
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
