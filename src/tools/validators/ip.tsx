'use client';

import type { IPv6 } from 'ipaddr.js';
import ipaddr from 'ipaddr.js';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

type RangeTone = 'default' | 'accent' | 'success' | 'warning' | 'danger';

type IpAnalysis = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized?: string;
  expanded?: string;
  version?: 'IPv4' | 'IPv6';
  rangeLabel?: string;
  rangeTone?: RangeTone;
  prefix?: number | null;
  isCidr?: boolean;
  network?: string;
  lastAddress?: string;
  firstUsable?: string;
  lastUsable?: string;
  broadcast?: string;
  subnetMask?: string;
  totalAddresses?: string;
  hostBitsSet?: boolean;
  integer?: string;
  mappedIPv4?: string;
  zoneId?: string;
};

const RANGE_META: Record<string, { label: string; tone: RangeTone }> = {
  unicast: { label: 'Public unicast', tone: 'success' },
  private: { label: 'Private', tone: 'warning' },
  loopback: { label: 'Loopback', tone: 'default' },
  linkLocal: { label: 'Link-local', tone: 'warning' },
  multicast: { label: 'Multicast', tone: 'accent' },
  reserved: { label: 'Reserved', tone: 'danger' },
  unspecified: { label: 'Unspecified', tone: 'danger' },
  broadcast: { label: 'Broadcast', tone: 'danger' },
  carrierGradeNat: { label: 'Carrier-grade NAT', tone: 'warning' },
  uniqueLocal: { label: 'Unique local (private)', tone: 'warning' },
  ipv4Mapped: { label: 'IPv4-mapped IPv6', tone: 'accent' },
  rfc6145: { label: 'IPv4/IPv6 translation', tone: 'accent' },
  rfc6052: { label: 'IPv4/IPv6 translation', tone: 'accent' },
  '6to4': { label: '6to4 transition', tone: 'accent' },
  teredo: { label: 'Teredo tunnel', tone: 'accent' },
  benchmarking: { label: 'Benchmarking', tone: 'warning' },
  amt: { label: 'AMT', tone: 'accent' },
  as112: { label: 'AS112', tone: 'accent' },
  as112v6: { label: 'AS112', tone: 'accent' },
  orchid2: { label: 'ORCHIDv2', tone: 'accent' },
  droneRemoteIdProtocolEntityTags: {
    label: 'Drone remote ID',
    tone: 'accent',
  },
};

const addressToBigInt = (bytes: number[]): bigint =>
  bytes.reduce((total, byte) => (total << 8n) + BigInt(byte), 0n);

const bigIntToBytes = (value: bigint, length: number): number[] => {
  const bytes = new Array<number>(length).fill(0);
  let remaining = value;
  for (let index = length - 1; index >= 0; index -= 1) {
    bytes[index] = Number(remaining & 255n);
    remaining >>= 8n;
  }
  return bytes;
};

export default function IpValidator() {
  const [input, setInput] = useState('');

  const analysis = useMemo((): IpAnalysis | null => {
    const value = input.trim();
    if (!value) {
      return null;
    }

    const slashCount = (value.match(/\//g) ?? []).length;
    const isCidr = slashCount > 0;

    if (slashCount > 1) {
      return {
        valid: false,
        errors: [
          'A CIDR block can contain only one slash, for example 10.0.0.0/8.',
        ],
        warnings: [],
      };
    }

    let parsed;
    let prefix: number | null = null;

    try {
      if (isCidr) {
        const cidr = ipaddr.parseCIDR(value);
        parsed = cidr[0];
        prefix = cidr[1];
      } else {
        parsed = ipaddr.parse(value);
      }
    } catch (error) {
      const detail =
        error instanceof Error
          ? error.message.replace(/^ipaddr:\s*/i, '')
          : 'The address could not be parsed.';
      const prefixText = isCidr ? value.slice(value.lastIndexOf('/') + 1) : '';
      const prefixHint =
        isCidr && !/^\d+$/.test(prefixText)
          ? 'The CIDR prefix must be a whole number after the slash, such as /24 or /64.'
          : '';
      return {
        valid: false,
        errors: [
          `This is not a valid IPv4 or IPv6 address${isCidr ? ' or CIDR block' : ''}. ${detail}`,
          ...(prefixHint ? [prefixHint] : []),
          'IPv4 looks like 192.168.1.1. IPv6 looks like 2001:db8::1. CIDR adds a prefix such as /24 or /64.',
        ],
        warnings: [],
      };
    }

    const kind = parsed.kind();
    const ipv6 = kind === 'ipv6' ? (parsed as IPv6) : null;
    const bits = kind === 'ipv4' ? 32 : 128;
    const bytes = parsed.toByteArray();
    const addressBig = addressToBigInt(bytes);
    const range = parsed.range();
    const meta = RANGE_META[range] ?? {
      label: range,
      tone: 'default' as RangeTone,
    };
    const warnings: string[] = [];

    let mappedIPv4: string | undefined;
    if (ipv6?.isIPv4MappedAddress()) {
      const embedded = ipv6.toIPv4Address();
      mappedIPv4 = `${embedded.toString()} (${RANGE_META[embedded.range()]?.label ?? embedded.range()})`;
      if (embedded.range() === 'private' || embedded.range() === 'loopback') {
        warnings.push(
          `The embedded IPv4 address ${embedded.toString()} is ${RANGE_META[embedded.range()]?.label.toLowerCase() ?? embedded.range()}.`
        );
      }
    }

    let network: string | undefined;
    let lastAddress: string | undefined;
    let firstUsable: string | undefined;
    let lastUsable: string | undefined;
    let broadcast: string | undefined;
    let subnetMask: string | undefined;
    let totalAddresses: string | undefined;
    let hostBits: number | undefined;
    let hostBitsSet = false;

    if (prefix !== null) {
      hostBits = bits - prefix;
      const hostMask = (1n << BigInt(hostBits)) - 1n;
      const networkBig = addressBig & ~hostMask;
      const lastBig = networkBig | hostMask;
      const networkAddress = ipaddr.fromByteArray(
        bigIntToBytes(networkBig, bytes.length)
      );
      const last = ipaddr.fromByteArray(bigIntToBytes(lastBig, bytes.length));
      network = networkAddress.toString();
      lastAddress = last.toString();
      hostBitsSet = addressBig !== networkBig;

      if (hostBits <= 32) {
        const total = 1n << BigInt(hostBits);
        totalAddresses = `${total.toLocaleString('en-US')} ${
          total === 1n ? 'address' : 'addresses'
        } (2^${hostBits})`;
      } else {
        totalAddresses = `2^${hostBits} addresses`;
      }

      if (kind === 'ipv4') {
        subnetMask = ipaddr.IPv4.subnetMaskFromPrefixLength(prefix).toString();
        broadcast = prefix <= 30 ? last.toString() : 'None';
        if (prefix === 32) {
          firstUsable = network;
          lastUsable = network;
        } else if (prefix === 31) {
          firstUsable = network;
          lastUsable = last.toString();
        } else {
          firstUsable = ipaddr
            .fromByteArray(bigIntToBytes(networkBig + 1n, bytes.length))
            .toString();
          lastUsable = ipaddr
            .fromByteArray(bigIntToBytes(lastBig - 1n, bytes.length))
            .toString();
        }
      } else if (prefix < 128) {
        firstUsable = network;
        lastUsable = last.toString();
      } else {
        firstUsable = network;
        lastUsable = network;
      }

      if (hostBitsSet) {
        warnings.push(
          `The address contains host bits, so it is a host inside ${network}/${prefix} rather than the network address.`
        );
      }
    }

    return {
      valid: true,
      errors: [] as string[],
      warnings,
      normalized: parsed.toString(),
      expanded: ipv6 ? ipv6.toNormalizedString() : parsed.toString(),
      version: kind === 'ipv4' ? 'IPv4' : 'IPv6',
      rangeLabel: meta.label,
      rangeTone: meta.tone,
      prefix,
      isCidr,
      network,
      lastAddress,
      firstUsable,
      lastUsable,
      broadcast,
      subnetMask,
      totalAddresses,
      hostBitsSet,
      integer: addressBig.toString(),
      mappedIPv4,
      zoneId: ipv6?.zoneId,
    };
  }, [input]);

  return (
    <ToolLayout>
      <Panel
        description="Parses IPv4 and IPv6 addresses, normalizes them, classifies their range and optionally expands a CIDR block."
        title="IP address or CIDR"
      >
        <Field hint="A /prefix is optional" label="Address to validate">
          <Input
            aria-label="IP address or CIDR to validate"
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
            placeholder="192.168.1.1 or 2001:db8::1"
            spellCheck={false}
            type="text"
            value={input}
          />
        </Field>
        <Examples
          items={[
            '192.168.1.1',
            '8.8.8.8',
            '10.0.0.0/8',
            '2001:db8::1',
            'fe80::1',
          ]}
          onPick={setInput}
        />
      </Panel>

      <ResultPanel
        emptyText="Enter an IPv4 or IPv6 address to inspect it."
        label="Validation result"
        value={
          analysis?.valid
            ? `${analysis.normalized ?? ''}${analysis.prefix !== null && analysis.prefix !== undefined ? `/${analysis.prefix}` : ''}`
            : ''
        }
      >
        {analysis && (
          <div className="space-y-3">
            <Verdict
              title={
                analysis.valid
                  ? `Valid ${analysis.version ?? 'IP'}${analysis.isCidr ? ' CIDR block' : ' address'}`
                  : 'Invalid IP address'
              }
              valid={analysis.valid}
            >
              {analysis.valid ? (
                <span>
                  {analysis.normalized}
                  {analysis.prefix !== null && analysis.prefix !== undefined
                    ? `/${analysis.prefix}`
                    : ''}{' '}
                  is syntactically valid and classified as{' '}
                  {(analysis.rangeLabel ?? 'this range').toLowerCase()}.
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

            {analysis.valid && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={analysis.rangeTone ?? 'default'}>
                    {analysis.rangeLabel}
                  </Badge>
                  <Badge variant="accent">{analysis.version}</Badge>
                  {analysis.isCidr && <Badge>/{analysis.prefix} prefix</Badge>}
                  {analysis.zoneId && <Badge>Zone {analysis.zoneId}</Badge>}
                </div>

                <DetailList
                  details={[
                    {
                      label: 'Normalized address',
                      value: analysis.normalized || '—',
                      mono: true,
                      breakAll: true,
                    },
                    {
                      label: 'Address type',
                      value: analysis.rangeLabel,
                    },
                    ...(analysis.version === 'IPv6'
                      ? [
                          {
                            label: 'Expanded form',
                            value: analysis.expanded || '—',
                            mono: true,
                            wide: true,
                            breakAll: true,
                          },
                        ]
                      : []),
                    {
                      label: 'Integer value',
                      value: analysis.integer ?? '—',
                      mono: true,
                      wide: true,
                      breakAll: true,
                    },
                    ...(analysis.mappedIPv4
                      ? [
                          {
                            label: 'Embedded IPv4',
                            value: analysis.mappedIPv4,
                            mono: true,
                          },
                        ]
                      : []),
                    ...(analysis.prefix !== null &&
                    analysis.prefix !== undefined
                      ? [
                          {
                            label: 'Prefix length',
                            value: `/${analysis.prefix} (${analysis.hostBitsSet ? 'host bits set' : 'network address'})`,
                          },
                          {
                            label: 'Network address',
                            value: analysis.network ?? '—',
                            mono: true,
                          },
                          {
                            label:
                              analysis.version === 'IPv4'
                                ? 'Broadcast address'
                                : 'Last address',
                            value:
                              analysis.version === 'IPv4'
                                ? (analysis.broadcast ?? '—')
                                : (analysis.lastAddress ?? '—'),
                            mono: true,
                          },
                          {
                            label: 'Usable / address range',
                            value:
                              analysis.firstUsable && analysis.lastUsable
                                ? `${analysis.firstUsable} – ${analysis.lastUsable}`
                                : '—',
                            mono: true,
                            wide: true,
                            breakAll: true,
                          },
                          {
                            label: 'Total addresses',
                            value: analysis.totalAddresses ?? '—',
                          },
                          ...(analysis.subnetMask
                            ? [
                                {
                                  label: 'Subnet mask',
                                  value: analysis.subnetMask,
                                  mono: true,
                                },
                              ]
                            : []),
                        ]
                      : []),
                  ]}
                />

                <p className="text-xs leading-5 text-fg-muted">
                  Range classification comes from ipaddr.js. IPv6 has no
                  broadcast address, so the last address in the prefix is shown
                  instead. A syntactically valid address can still be unroutable
                  or reserved.
                </p>
              </>
            )}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
