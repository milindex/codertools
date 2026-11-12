'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { Toggle } from './_shared';

type Mode = 'static' | 'proxy';

const buildServerBody = ({
  mode,
  serverName,
  root,
  proxyPass,
  gzip,
  caching,
  clientMax,
  ssl,
  cert,
  key,
}: {
  mode: Mode;
  serverName: string;
  root: string;
  proxyPass: string;
  gzip: boolean;
  caching: boolean;
  clientMax: string;
  ssl: boolean;
  cert: string;
  key: string;
}) => {
  const lines: string[] = [];
  if (ssl) {
    lines.push('    listen 443 ssl;');
    lines.push('    listen [::]:443 ssl;');
    lines.push('    http2 on; # nginx 1.25.1+');
  } else {
    lines.push('    listen 80;');
    lines.push('    listen [::]:80;');
  }
  lines.push(`    server_name ${serverName};`);
  if (ssl) {
    lines.push('');
    lines.push(`    ssl_certificate ${cert};`);
    lines.push(`    ssl_certificate_key ${key};`);
    lines.push('    ssl_protocols TLSv1.2 TLSv1.3;');
    lines.push('    ssl_session_cache shared:SSL:10m;');
    lines.push('    ssl_session_timeout 1d;');
  }
  lines.push('');
  lines.push('    server_tokens off;');
  if (clientMax) {
    lines.push(`    client_max_body_size ${clientMax};`);
  }

  if (mode === 'static') {
    lines.push(`    root ${root};`);
    lines.push('    index index.html;');
  }

  if (gzip) {
    lines.push('');
    lines.push('    gzip on;');
    lines.push('    gzip_vary on;');
    lines.push('    gzip_min_length 1024;');
    lines.push('    gzip_comp_level 6;');
    lines.push(
      '    gzip_types text/plain text/css text/xml application/json application/javascript application/xml image/svg+xml;'
    );
  }

  lines.push('');
  if (mode === 'static') {
    lines.push('    location / {');
    lines.push('        try_files $uri $uri/ /index.html;');
    lines.push('    }');
  } else {
    lines.push('    location / {');
    lines.push(`        proxy_pass ${proxyPass};`);
    lines.push('        proxy_http_version 1.1;');
    lines.push('        proxy_set_header Host $host;');
    lines.push('        proxy_set_header X-Real-IP $remote_addr;');
    lines.push(
      '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;'
    );
    lines.push('        proxy_set_header X-Forwarded-Proto $scheme;');
    lines.push('        proxy_set_header Upgrade $http_upgrade;');
    lines.push('        proxy_set_header Connection "upgrade";');
    lines.push('        proxy_read_timeout 60s;');
    lines.push('    }');
  }

  if (caching) {
    lines.push('');
    lines.push(
      '    location ~* \\.(?:css|js|mjs|jpg|jpeg|png|gif|webp|avif|svg|ico|woff2?)$ {'
    );
    if (mode === 'proxy') {
      lines.push(`        proxy_pass ${proxyPass};`);
    } else {
      lines.push('        try_files $uri =404;');
    }
    lines.push('        expires 1y;');
    lines.push('        add_header Cache-Control "public, immutable";');
    lines.push('        access_log off;');
    lines.push('    }');
  }

  return lines.join('\n');
};

export default function NginxGeneratorTool() {
  const [mode, setMode] = useState<Mode>('static');
  const [serverName, setServerName] = useState('example.com');
  const [root, setRoot] = useState('/var/www/html');
  const [proxyPass, setProxyPass] = useState('http://127.0.0.1:3000');
  const [ssl, setSsl] = useState(false);
  const [cert, setCert] = useState('/etc/ssl/certs/example.com.pem');
  const [key, setKey] = useState('/etc/ssl/private/example.com.key');
  const [gzip, setGzip] = useState(true);
  const [caching, setCaching] = useState(true);
  const [clientMax, setClientMax] = useState('10m');

  const error = useMemo(() => {
    if (!serverName.trim()) {
      return 'Enter a server_name value, such as example.com.';
    }
    if (mode === 'static' && !root.trim()) {
      return 'Enter the document root for the static site.';
    }
    if (mode === 'proxy' && !proxyPass.trim()) {
      return 'Enter the upstream URL to proxy requests to.';
    }
    if (mode === 'proxy' && !/^https?:\/\/\S+$/i.test(proxyPass.trim())) {
      return 'The proxy target must be an http:// or https:// URL, for example http://127.0.0.1:3000.';
    }
    if (ssl && !cert.trim()) {
      return 'Enter the path to the SSL certificate.';
    }
    if (ssl && !key.trim()) {
      return 'Enter the path to the SSL private key.';
    }
    if (clientMax.trim() && !/^\d+[kKmMgG]?$/.test(clientMax.trim())) {
      return 'client_max_body_size must be a size such as 10m, 512k or 1g.';
    }
    return null;
  }, [cert, clientMax, key, mode, proxyPass, root, serverName, ssl]);

  const output = useMemo(() => {
    if (error) {
      return '';
    }
    const body = buildServerBody({
      mode,
      serverName: serverName.trim(),
      root: root.trim(),
      proxyPass: proxyPass.trim(),
      gzip,
      caching,
      clientMax: clientMax.trim(),
      ssl,
      cert: cert.trim(),
      key: key.trim(),
    });

    const blocks = [
      '# Generated by CoderTools',
      '# Nginx server configuration',
    ];
    if (ssl) {
      blocks.push(
        '',
        'server {',
        '    listen 80;',
        '    listen [::]:80;',
        `    server_name ${serverName.trim()};`,
        '',
        '    return 301 https://$host$request_uri;',
        '}'
      );
    }
    blocks.push('', 'server {', body, '}');
    return blocks.join('\n');
  }, [
    caching,
    cert,
    clientMax,
    error,
    gzip,
    key,
    mode,
    proxyPass,
    root,
    serverName,
    ssl,
  ]);

  return (
    <ToolLayout>
      <Panel
        description="Generate a server block for a static single-page app or a reverse proxy, with optional TLS, gzip and asset caching."
        title="Nginx configuration"
      >
        <div className="space-y-3">
          <SegmentedControl
            ariaLabel="Server type"
            onChange={(value) => setMode(value as Mode)}
            options={[
              { value: 'static', label: 'Static / SPA' },
              { value: 'proxy', label: 'Reverse proxy' },
            ]}
            value={mode}
          />

          <Field label="server_name">
            <Input
              onChange={(event) => setServerName(event.target.value)}
              placeholder="example.com"
              spellCheck={false}
              value={serverName}
            />
          </Field>

          {mode === 'static' ? (
            <Field hint="Directory containing index.html" label="Document root">
              <Input
                onChange={(event) => setRoot(event.target.value)}
                placeholder="/var/www/html"
                spellCheck={false}
                value={root}
              />
            </Field>
          ) : (
            <Field hint="Include the scheme and port" label="Proxy target">
              <Input
                onChange={(event) => setProxyPass(event.target.value)}
                placeholder="http://127.0.0.1:3000"
                spellCheck={false}
                value={proxyPass}
              />
            </Field>
          )}

          <Field
            hint="Optional, for example 10m or 0"
            label="client_max_body_size"
          >
            <Input
              onChange={(event) => setClientMax(event.target.value)}
              placeholder="10m"
              spellCheck={false}
              value={clientMax}
            />
          </Field>

          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle
              checked={ssl}
              hint="Redirect port 80 and add a TLS server block."
              label="SSL / TLS"
              onChange={setSsl}
            />
            <Toggle
              checked={gzip}
              hint="Compress text, JSON, JavaScript and SVG."
              label="Gzip"
              onChange={setGzip}
            />
            <Toggle
              checked={caching}
              hint="One-year immutable headers for static assets."
              label="Asset caching"
              onChange={setCaching}
            />
          </div>

          {ssl && (
            <div className="grid gap-2.5">
              <Field label="Certificate path">
                <Input
                  onChange={(event) => setCert(event.target.value)}
                  spellCheck={false}
                  value={cert}
                />
              </Field>
              <Field label="Private key path">
                <Input
                  onChange={(event) => setKey(event.target.value)}
                  spellCheck={false}
                  value={key}
                />
              </Field>
            </div>
          )}

          {error && (
            <Callout variant="error" title="Configuration needs attention">
              {error}
            </Callout>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="accent">
              {mode === 'static' ? 'static SPA' : 'reverse proxy'}
            </Badge>
            {ssl && <Badge variant="success">HTTPS</Badge>}
            {gzip && <Badge>gzip</Badge>}
            {caching && <Badge>cache</Badge>}
          </div>

          <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
            HTTP/2 uses the <code>http2 on;</code> directive, which requires
            nginx 1.25.1 or newer. Run <code>nginx -t</code> before reloading.
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={error}
        filename="nginx.conf"
        label="nginx.conf"
        mime="text/plain;charset=utf-8"
        value={output}
      />
    </ToolLayout>
  );
}
