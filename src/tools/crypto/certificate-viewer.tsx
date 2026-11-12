'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { FileDropzone } from '@/components/ui/FileDropzone';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';
import { ensureReflectMetadata } from '@/tools/crypto/_reflect';
import { bytesToBase64 } from '@/tools/crypto/_utils';

ensureReflectMetadata();

type CertInfo = {
  subject: string;
  issuer: string;
  serial: string;
  notBefore: string;
  notAfter: string;
  validity: string;
  validityVariant: 'success' | 'warning' | 'danger';
  signature: string;
  publicKey: string;
  sans: { type: string; value: string }[];
  summary: string;
};

const formatDate = (date: Date): string => {
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }
  return `${date.toLocaleString()} (${date.toISOString()})`;
};

const formatSerial = (serial: string): string =>
  (serial.toUpperCase().match(/.{1,2}/g) ?? [serial.toUpperCase()]).join(':');

export default function CertificateViewerTool() {
  const [input, setInput] = useState('');
  const [cert, setCert] = useState<CertInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = async (value: string) => {
    setBusy(true);
    setCert(null);
    setError(null);

    try {
      if (!value.trim()) {
        throw new Error('Paste a PEM certificate first.');
      }

      const x509 = await import('@peculiar/x509');
      const certificate = new x509.X509Certificate(value.trim());

      const sanExtension = certificate.getExtension(
        x509.SubjectAlternativeNameExtension
      );
      const sans = sanExtension
        ? sanExtension.names.items.map((name) => ({
            type: name.type,
            value: name.value,
          }))
        : [];

      const now = Date.now();
      const notBefore = certificate.notBefore;
      const notAfter = certificate.notAfter;
      let validity = 'Valid';
      let validityVariant: CertInfo['validityVariant'] = 'success';
      if (now < notBefore.getTime()) {
        validity = 'Not yet valid';
        validityVariant = 'warning';
      } else if (now > notAfter.getTime()) {
        validity = 'Expired';
        validityVariant = 'danger';
      }

      const keyAlgorithm = certificate.publicKey.algorithm as Algorithm & {
        modulusLength?: number;
        namedCurve?: string;
        hash?: Algorithm;
      };
      const keyDetails: string[] = [];
      if (typeof keyAlgorithm.modulusLength === 'number') {
        keyDetails.push(`${keyAlgorithm.modulusLength} bits`);
      }
      if (typeof keyAlgorithm.namedCurve === 'string') {
        keyDetails.push(keyAlgorithm.namedCurve);
      }
      if (keyAlgorithm.hash?.name) {
        keyDetails.push(keyAlgorithm.hash.name);
      }

      const signatureHash = certificate.signatureAlgorithm.hash?.name;
      const signature = signatureHash
        ? `${certificate.signatureAlgorithm.name} with ${signatureHash}`
        : certificate.signatureAlgorithm.name;
      const publicKey = keyDetails.length
        ? `${keyAlgorithm.name} (${keyDetails.join(', ')})`
        : keyAlgorithm.name;

      const summaryLines = [
        `Subject: ${certificate.subject}`,
        `Issuer: ${certificate.issuer}`,
        `Serial: ${formatSerial(certificate.serialNumber)}`,
        `Not before: ${formatDate(notBefore)}`,
        `Not after: ${formatDate(notAfter)}`,
        `Validity: ${validity}`,
        `Signature: ${signature}`,
        `Public key: ${publicKey}`,
        ...(sans.length
          ? [
              `SAN: ${sans.map((name) => `${name.type}:${name.value}`).join(', ')}`,
            ]
          : []),
      ];

      setCert({
        subject: certificate.subject,
        issuer: certificate.issuer,
        serial: formatSerial(certificate.serialNumber),
        notBefore: formatDate(notBefore),
        notAfter: formatDate(notAfter),
        validity,
        validityVariant,
        signature,
        publicKey,
        sans,
        summary: summaryLines.join('\n'),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The certificate could not be parsed. Make sure it is a valid PEM certificate.'
      );
    } finally {
      setBusy(false);
    }
  };

  const rows: { label: string; value: string }[] = cert
    ? [
        { label: 'Subject', value: cert.subject },
        { label: 'Issuer', value: cert.issuer },
        { label: 'Serial number', value: cert.serial },
        { label: 'Not before', value: cert.notBefore },
        { label: 'Not after', value: cert.notAfter },
        { label: 'Signature algorithm', value: cert.signature },
        { label: 'Public key', value: cert.publicKey },
      ]
    : [];

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          actions={busy ? <Badge variant="accent">Parsing…</Badge> : undefined}
          description="Inspect the fields of an X.509 certificate. Parsing does not verify the certificate chain."
          title="Certificate"
        >
          <FileDropzone
            accept=".pem,.crt,.cer,.der,.txt,application/x-pem-file,application/x-x509-ca-cert,application/pkix-cert"
            hint="PEM, base64 or DER certificate file"
            label="Drop a certificate here, or click to browse"
            onFiles={(files) => {
              const file = files[0];
              if (file) {
                void file
                  .arrayBuffer()
                  .then((buffer) => {
                    const bytes = new Uint8Array(buffer);
                    const text = new TextDecoder().decode(bytes);
                    const value = text.includes('\uFFFD')
                      ? bytesToBase64(bytes)
                      : text;
                    setInput(value);
                    void parse(value);
                  })
                  .catch(() => {
                    setError('The selected file could not be read.');
                  });
              }
            }}
          />

          <Field
            className="mt-3"
            hint={`${input.length.toLocaleString()} characters`}
            label="PEM certificate"
          >
            <Textarea
              aria-label="PEM certificate"
              className="min-h-[220px]"
              onChange={(event) => {
                setInput(event.target.value);
                setCert(null);
                setError(null);
              }}
              placeholder={
                '-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIE…\n-----END CERTIFICATE-----'
              }
              value={input}
            />
          </Field>

          <div className="mt-3">
            <Button
              disabled={busy}
              onClick={() => void parse(input)}
              variant="primary"
            >
              {busy ? 'Parsing…' : 'Parse certificate'}
            </Button>
          </div>

          <Callout className="mt-4" variant="info">
            Supports PEM certificates, base64 text and binary DER files.
            Signature and trust-chain validation are not performed.
          </Callout>
        </Panel>

        <ResultPanel
          emptyText="Paste a PEM certificate and choose Parse certificate."
          error={error}
          filename="certificate.txt"
          label="Certificate details"
          value={cert?.summary ?? ''}
        >
          {cert ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={cert.validityVariant}>{cert.validity}</Badge>
                <Badge>{cert.sans.length} SANs</Badge>
              </div>

              <dl className="divide-y divide-border overflow-hidden rounded-md border border-border bg-canvas-inset">
                {rows.map((row) => (
                  <div
                    className="grid gap-1 px-3 py-2 sm:grid-cols-[9rem_1fr] sm:gap-3"
                    key={row.label}
                  >
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                      {row.label}
                    </dt>
                    <dd className="break-all font-mono text-xs leading-5 text-fg">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                  Subject alternative names
                </p>
                {cert.sans.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {cert.sans.map((name, index) => (
                      <Badge key={`${name.type}-${name.value}-${index}`}>
                        {name.type}: {name.value}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-fg-muted">
                    No subject alternative names found.
                  </p>
                )}
              </div>
            </div>
          ) : undefined}
        </ResultPanel>
      </ToolLayout>
    </div>
  );
}
