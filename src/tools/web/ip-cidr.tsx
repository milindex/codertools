'use client';

import * as ipaddr from 'ipaddr.js';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { ExampleChips, InfoGrid } from './_shared';

const RANGE_LABELS: Record<string, string> = {
  unicast: 'Public unicast',
  private: 'Private',
  loopback: 'Loopback',
  linkLocal: 'Link-local',
  multicast: 'Multicast',
  broadcast: 'Broadcast',
  unspecified: 'Unspecified',
  reserved: 'Reserved',
  carrierGradeNat: 'Carrier-grade NAT',
  uniqueLocal: 'Unique local',
  ipv4Mapped: 'IPv4-mapped',
  rfc6145: 'IPv4-translated',
  rfc6052: 'IPv4/IPv6 translation',
  '6to4': '6to4',
  teredo: 'Teredo',
  as112: 'AS112',
  as112v6: 'AS112',
  benchmarking: 'Benchmarking',
  amt: 'AMT',
  orchid2: 'ORCHIDv2',
  droneRemoteIdProtocolEntityTags: 'Drone remote ID',
};

const rangeVariant = (
  range: string
): 'default' | 'accent' | 'success' | 'warning' | 'danger' => {
  if (
    range === 'private' ||
    range === 'loopback' ||
    range === 'linkLocal' ||
    range === 'uniqueLocal'
  ) {
    return 'warning';
  }
  if (
    range === 'multicast' ||
    range === 'broadcast' ||
    range === 'reserved' ||
    range === 'unspecified'
  ) {
    return 'danger';
  }
  return 'success';
};

const v4ToBigInt = (bytes: number[]) =>
  bytes.reduce((accumulator, byte) => (accumulator << 8n) | BigInt(byte), 0n);

const bigIntToBytes = (value: bigint, length: number) => {
  const bytes = new Array<number>(length).fill(0);
  let remaining = value;
  for (let index = length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return bytes;
};

const v4String = (value: bigint) =>
  [24, 16, 8, 0]
    .map((shift) => Number((value >> BigInt(shift)) & 255n))
    .join('.');

const ipString = (value: bigint, bytes: number) =>
  ipaddr.fromByteArray(bigIntToBytes(value, bytes)).toString();

type IpInfo = {
  version: 'IPv4' | 'IPv6';
  input: string;
  address: string;
  prefix: number;
  cidr: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  hostLabel: string;
  total: bigint;
  usable: bigint;
  netmask?: string;
  wildcard?: string;
  range: string;
  decimal?: bigint;
};

const buildInfo = (raw: string): IpInfo | { error: string } => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      error: 'Enter an IPv4 or IPv6 address, optionally with a CIDR prefix.',
    };
  }

  let address: ipaddr.IPv4 | ipaddr.IPv6;
  let prefix: number;
  try {
    if (trimmed.includes('/')) {
      const parsed = ipaddr.parseCIDR(trimmed);
      address = parsed[0];
      prefix = parsed[1];
    } else {
      address = ipaddr.parse(trimmed);
      prefix = address.kind() === 'ipv4' ? 32 : 128;
    }
  } catch {
    return {
      error:
        'That is not a valid IP address or CIDR range. Examples: 192.168.1.10/24, 10.0.0.0/8, 2001:db8::1/64.',
    };
  }

  const totalBits = address.kind() === 'ipv4' ? 32 : 128;
  if (prefix < 0 || prefix > totalBits) {
    return {
      error: `The prefix must be between 0 and ${totalBits} for ${address.kind() === 'ipv4' ? 'IPv4' : 'IPv6'}.`,
    };
  }

  const byteLength = totalBits / 8;
  const addressBytes = address.toByteArray();
  const addressInt = v4ToBigInt(addressBytes);
  const hostMask = (1n << BigInt(totalBits - prefix)) - 1n;
  const fullMask = (1n << BigInt(totalBits)) - 1n;
  const networkInt = addressInt & (fullMask ^ hostMask);
  const lastInt = networkInt | hostMask;
  const total = hostMask + 1n;

  const isV4 = address.kind() === 'ipv4';
  const range = address.range();

  const network = ipString(networkInt, byteLength);
  const last = ipString(lastInt, byteLength);

  let firstHostValue: bigint;
  let lastHostValue: bigint;
  let usable: bigint;
  let hostLabel: string;
  let broadcast = last;

  if (isV4) {
    if (prefix >= 31) {
      firstHostValue = networkInt;
      lastHostValue = lastInt;
      usable = total;
    } else {
      firstHostValue = networkInt + 1n;
      lastHostValue = lastInt - 1n;
      usable = total - 2n;
    }
    hostLabel = prefix >= 31 ? 'Usable address' : 'Usable hosts';
  } else {
    firstHostValue = networkInt;
    lastHostValue = lastInt;
    usable = total;
    hostLabel = 'Addresses in range';
    broadcast = last;
  }

  const netmaskValue = fullMask ^ hostMask;

  return {
    version: isV4 ? 'IPv4' : 'IPv6',
    input: trimmed,
    address: address.toString(),
    prefix,
    cidr: `${network}/${prefix}`,
    network,
    broadcast,
    firstHost: ipString(firstHostValue, byteLength),
    lastHost: ipString(lastHostValue, byteLength),
    hostLabel,
    total,
    usable,
    netmask: isV4 ? v4String(netmaskValue) : undefined,
    wildcard: isV4 ? v4String(hostMask) : undefined,
    range,
    decimal: isV4 ? addressInt : undefined,
  };
};

const formatNumber = (value: bigint) => value.toLocaleString('en-US');

export default function IpCidrTool() {
  const [input, setInput] = useState('192.168.1.10/24');

  const info = useMemo(() => buildInfo(input), [input]);
  const data = 'error' in info ? null : info;

  const json = data
    ? JSON.stringify(
        {
          input: data.input,
          version: data.version,
          address: data.address,
          prefix: data.prefix,
          cidr: data.cidr,
          network: data.network,
          broadcast: data.version === 'IPv4' ? data.broadcast : undefined,
          firstAddress: data.firstHost,
          lastAddress: data.lastHost,
          netmask: data.netmask,
          wildcard: data.wildcard,
          totalAddresses: data.total.toString(),
          usableAddresses: data.usable.toString(),
          range: data.range,
        },
        null,
        2
      )
    : '';

  return (
    <ToolLayout>
      <Panel
        description="Parse an address or CIDR range and calculate the network boundaries, host range and address counts."
        title="IP address or CIDR"
      >
        <div className="space-y-3">
          <Input
            aria-label="IP address or CIDR range"
            onChange={(event) => setInput(event.target.value)}
            placeholder="192.168.1.10/24 or 2001:db8::1/64"
            spellCheck={false}
            value={input}
          />

          <ExampleChips
            examples={[
              { label: 'Private /24', value: '192.168.1.10/24' },
              { label: 'Private /8', value: '10.0.0.0/8' },
              { label: 'Loopback', value: '127.0.0.1/32' },
              { label: 'IPv6 /64', value: '2001:db8::1/64' },
              { label: 'IPv6 /128', value: '2001:db8::1' },
              { label: 'Carrier NAT', value: '100.64.0.1/10' },
            ]}
            onPick={setInput}
          />

          {'error' in info && (
            <Callout variant="error" title="Invalid address">
              {info.error}
            </Callout>
          )}

          {data && (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="accent">{data.version}</Badge>
              <Badge variant="default">/{data.prefix}</Badge>
              <Badge variant={rangeVariant(data.range)}>
                {RANGE_LABELS[data.range] ?? data.range}
              </Badge>
              {data.total === 1n && (
                <Badge variant="success">single host</Badge>
              )}
            </div>
          )}

          <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
            Calculations use BigInt, so IPv6 ranges such as /0 with 2
            <sup>128</sup> addresses are exact. Without a prefix, IPv4 defaults
            to /32 and IPv6 to /128.
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={'error' in info ? info.error : null}
        filename="ip-cidr.json"
        label="Network breakdown"
        mime="application/json"
        value={json}
      >
        {data ? (
          <div className="max-h-[520px] space-y-4 overflow-auto">
            <InfoGrid
              items={[
                { label: 'Input', value: data.input },
                { label: 'Normalized address', value: data.address },
                { label: 'Version', value: data.version },
                { label: 'CIDR prefix', value: `/${data.prefix}` },
                { label: 'Network', value: data.cidr },
                {
                  label: data.version === 'IPv4' ? 'Broadcast' : 'Last address',
                  value: data.broadcast,
                },
                {
                  label:
                    data.version === 'IPv4'
                      ? 'First usable host'
                      : 'First address',
                  value: data.firstHost,
                },
                {
                  label:
                    data.version === 'IPv4'
                      ? 'Last usable host'
                      : 'Last address',
                  value: data.lastHost,
                },
                ...(data.netmask
                  ? [
                      { label: 'Subnet mask', value: data.netmask },
                      { label: 'Wildcard mask', value: data.wildcard ?? '' },
                    ]
                  : []),
                { label: 'Total addresses', value: formatNumber(data.total) },
                { label: data.hostLabel, value: formatNumber(data.usable) },
                {
                  label: 'Address range',
                  value: RANGE_LABELS[data.range] ?? data.range,
                },
                ...(data.decimal !== undefined
                  ? [
                      { label: 'Decimal', value: data.decimal.toString() },
                      {
                        label: 'Hexadecimal',
                        value: `0x${data.decimal.toString(16).padStart(8, '0')}`,
                      },
                    ]
                  : []),
              ]}
            />

            <div className="rounded-md border border-border bg-canvas-subtle/40 px-3 py-2 text-xs leading-5 text-fg-muted">
              {data.version === 'IPv4'
                ? 'For /31 networks both addresses are reported as usable (RFC 3021). A /32 is a single host.'
                : 'IPv6 has no broadcast address; every address in the prefix is part of the subnet range.'}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[230px] items-center justify-center rounded-md border border-dashed border-border bg-canvas-inset/50 p-4 text-center text-sm text-fg-muted">
            The network address, host range and address counts will appear here.
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
