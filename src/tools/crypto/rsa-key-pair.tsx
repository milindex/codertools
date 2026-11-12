'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { derToPem } from '@/tools/crypto/_utils';

const ALGORITHMS = [
  {
    value: 'RSA-OAEP',
    label: 'RSA-OAEP (encryption)',
    usages: ['encrypt', 'decrypt'] as KeyUsage[],
  },
  {
    value: 'RSASSA-PKCS1-v1_5',
    label: 'RSASSA-PKCS1-v1_5 (signatures)',
    usages: ['sign', 'verify'] as KeyUsage[],
  },
] as const;

const HASHES = ['SHA-256', 'SHA-384', 'SHA-512'] as const;

type Algorithm = (typeof ALGORITHMS)[number]['value'];
type Hash = (typeof HASHES)[number];

export default function RsaKeyPairTool() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('RSA-OAEP');
  const [keySize, setKeySize] = useState(2048);
  const [hash, setHash] = useState<Hash>('SHA-256');
  const [publicPem, setPublicPem] = useState('');
  const [privatePem, setPrivatePem] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setBusy(true);
    setPublicPem('');
    setPrivatePem('');
    setError(null);

    try {
      if (!globalThis.crypto?.subtle) {
        throw new Error(
          'Web Crypto is not available. Use a modern browser over HTTPS.'
        );
      }
      const selected = ALGORITHMS.find((item) => item.value === algorithm);
      if (!selected) {
        throw new Error('Choose a supported RSA algorithm.');
      }

      const keyPair = (await globalThis.crypto.subtle.generateKey(
        {
          name: algorithm,
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash,
        },
        true,
        selected.usages
      )) as CryptoKeyPair;

      const [spki, pkcs8] = await Promise.all([
        globalThis.crypto.subtle.exportKey('spki', keyPair.publicKey),
        globalThis.crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
      ]);

      setPublicPem(derToPem(new Uint8Array(spki), 'PUBLIC KEY'));
      setPrivatePem(derToPem(new Uint8Array(pkcs8), 'PRIVATE KEY'));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The RSA key pair could not be generated.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={
            busy ? <Badge variant="accent">Generating…</Badge> : undefined
          }
          description="Keys are generated with the Web Crypto API and never leave your browser."
          title="Key settings"
        >
          <div className="space-y-3">
            <Field label="Algorithm">
              <Select
                aria-label="RSA algorithm"
                disabled={busy}
                onChange={(event) =>
                  setAlgorithm(event.target.value as Algorithm)
                }
                value={algorithm}
              >
                {ALGORITHMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              hint="Larger keys are slower to generate and use."
              label="Key size"
            >
              <Select
                aria-label="RSA key size"
                disabled={busy}
                onChange={(event) => setKeySize(Number(event.target.value))}
                value={keySize}
              >
                <option value={2048}>2048-bit (default)</option>
                <option value={3072}>3072-bit</option>
                <option value={4096}>4096-bit (slowest)</option>
              </Select>
            </Field>

            <Field label="Hash function">
              <Select
                aria-label="RSA hash function"
                disabled={busy}
                onChange={(event) => setHash(event.target.value as Hash)}
                value={hash}
              >
                {HASHES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-3">
            <Button
              disabled={busy}
              onClick={() => void generate()}
              variant="primary"
            >
              {busy ? 'Generating key pair…' : 'Generate RSA key pair'}
            </Button>
          </div>

          <Callout className="mt-4" variant="warning">
            4096-bit generation can take several seconds. Treat the private key
            as a secret and store it securely.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Generate a key pair to export the public key."
          error={error}
          filename={`rsa-public-${keySize}.pem`}
          label="Public key (SPKI PEM)"
          mime="application/x-pem-file"
          value={publicPem}
        />
      </ToolLayout>

      <ResultPanel
        emptyText="The private key will appear here after generation."
        filename={`rsa-private-${keySize}.pem`}
        label="Private key (PKCS#8 PEM)"
        mime="application/x-pem-file"
        value={privatePem}
      >
        {privatePem ? (
          <div className="space-y-3">
            <Callout variant="warning">
              Anyone with this private key can decrypt data or forge signatures
              for this key pair. Do not share it.
            </Callout>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-canvas-inset p-3 font-mono text-[13px] leading-6 text-fg">
              {privatePem}
            </pre>
          </div>
        ) : undefined}
      </ResultPanel>
    </div>
  );
}
