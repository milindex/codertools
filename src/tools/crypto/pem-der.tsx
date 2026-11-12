'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import {
  base64ToBytes,
  bytesToBase64,
  bytesToHex,
  derToPem,
  hexToBytes,
  parsePemBlocks,
} from '@/tools/crypto/_utils';

const LABELS = [
  'PUBLIC KEY',
  'PRIVATE KEY',
  'RSA PRIVATE KEY',
  'EC PRIVATE KEY',
  'CERTIFICATE',
  'CERTIFICATE REQUEST',
] as const;

type Direction = 'toDer' | 'toPem';
type Encoding = 'base64' | 'hex';

export default function PemDerTool() {
  const [direction, setDirection] = useState<Direction>('toDer');
  const [label, setLabel] = useState<string>('PUBLIC KEY');
  const [encoding, setEncoding] = useState<Encoding>('base64');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [detected, setDetected] = useState<string | null>(null);
  const [byteLength, setByteLength] = useState<number | null>(null);
  const [blockCount, setBlockCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const convert = () => {
    setOutput('');
    setDetected(null);
    setByteLength(null);
    setBlockCount(0);
    setError(null);

    try {
      if (!input.trim()) {
        throw new Error(
          direction === 'toDer'
            ? 'Paste a PEM block to convert.'
            : 'Paste base64 or hex DER data to convert.'
        );
      }

      if (direction === 'toDer') {
        const blocks = parsePemBlocks(input);
        const first = blocks[0];
        if (!first) {
          throw new Error('No PEM block found.');
        }
        setDetected(first.label);
        setBlockCount(blocks.length);
        setByteLength(first.der.length);
        setOutput(
          encoding === 'hex' ? bytesToHex(first.der) : bytesToBase64(first.der)
        );
      } else {
        const der =
          encoding === 'hex' ? hexToBytes(input) : base64ToBytes(input);
        if (der.length === 0) {
          throw new Error('The decoded DER data is empty.');
        }
        setByteLength(der.length);
        setOutput(derToPem(der, label));
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The conversion failed. Check the input format.'
      );
    }
  };

  const switchDirection = (next: Direction) => {
    setDirection(next);
    setOutput('');
    setDetected(null);
    setByteLength(null);
    setBlockCount(0);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="PEM is base64-encoded DER wrapped in BEGIN/END header lines. Convert in either direction."
          title="Convert"
        >
          <Field label="Direction">
            <SegmentedControl
              ariaLabel="Conversion direction"
              onChange={(value) => switchDirection(value as Direction)}
              options={[
                { value: 'toDer', label: 'PEM → DER' },
                { value: 'toPem', label: 'DER → PEM' },
              ]}
              value={direction}
            />
          </Field>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field
              hint={
                direction === 'toDer'
                  ? 'Output uses this encoding'
                  : 'Input uses this encoding'
              }
              label={
                direction === 'toDer' ? 'Output encoding' : 'Input encoding'
              }
            >
              <SegmentedControl
                ariaLabel="DER encoding"
                onChange={(value) => setEncoding(value as Encoding)}
                options={[
                  { value: 'base64', label: 'Base64' },
                  { value: 'hex', label: 'Hex' },
                ]}
                value={encoding}
              />
            </Field>

            {direction === 'toPem' && (
              <Field hint="Header used around the PEM" label="PEM label">
                <Select
                  aria-label="PEM label"
                  onChange={(event) => setLabel(event.target.value)}
                  value={label}
                >
                  {LABELS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>

          <Field
            className="mt-3"
            hint={`${input.length.toLocaleString()} characters`}
            label={direction === 'toDer' ? 'PEM input' : 'DER input'}
          >
            <Textarea
              aria-label={direction === 'toDer' ? 'PEM input' : 'DER input'}
              className="min-h-[220px]"
              onChange={(event) => {
                setInput(event.target.value);
                setOutput('');
                setError(null);
              }}
              placeholder={
                direction === 'toDer'
                  ? '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A…\n-----END PUBLIC KEY-----'
                  : encoding === 'hex'
                    ? '30820122300d06092a864886f70d01010105…'
                    : 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A…'
              }
              value={input}
            />
          </Field>

          <div className="mt-3">
            <Button onClick={convert} variant="primary">
              Convert
            </Button>
          </div>

          <Callout className="mt-4" variant="info">
            DER is binary. This tool shows it as base64 or hex text so it can be
            copied. When converting back, choose the same encoding and the
            correct PEM label for the data.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Paste data and choose Convert."
          error={error}
          filename={direction === 'toPem' ? 'converted.pem' : 'converted.txt'}
          label={direction === 'toPem' ? 'PEM output' : `DER (${encoding})`}
          value={output}
        >
          {output ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {detected && <Badge variant="accent">{detected}</Badge>}
                {byteLength !== null && (
                  <Badge>{byteLength.toLocaleString()} bytes DER</Badge>
                )}
                {blockCount > 1 && (
                  <Badge variant="warning">
                    {blockCount} blocks found, using the first
                  </Badge>
                )}
              </div>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
                {output}
              </pre>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
