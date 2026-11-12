'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type ParsedService = {
  name: string;
  image: string;
  containerName?: string;
  hostname?: string;
  restart?: string;
  workingDir?: string;
  user?: string;
  entrypoint?: string;
  ports: string[];
  volumes: string[];
  environment: string[];
  envFiles: string[];
  networks: string[];
  command: string[];
};

type ParseResult = {
  services: ParsedService[];
  warnings: string[];
  yaml: string;
};

const VALUE_FLAGS = new Set([
  '-p',
  '--publish',
  '-v',
  '--volume',
  '-e',
  '--env',
  '--env-file',
  '--name',
  '--network',
  '--net',
  '--restart',
  '--hostname',
  '-h',
  '-w',
  '--workdir',
  '-u',
  '--user',
  '--entrypoint',
  '--platform',
  '--memory',
  '-m',
  '--cpus',
  '--cap-add',
  '--cap-drop',
  '--device',
  '--dns',
  '--add-host',
  '--label',
  '-l',
  '--log-driver',
  '--log-opt',
  '--mount',
  '--tmpfs',
  '--shm-size',
  '--ulimit',
  '--network-alias',
  '--ip',
  '--ip6',
  '--mac-address',
  '--pid',
  '--ipc',
  '--userns',
  '--security-opt',
  '--sysctl',
  '--gpus',
  '--runtime',
  '--stop-signal',
  '--stop-timeout',
  '--health-cmd',
  '--health-interval',
  '--health-timeout',
  '--health-retries',
  '--health-start-period',
]);

const SHORT_VALUE_FLAGS = ['-p', '-v', '-e', '-w', '-u', '-h'];

const tokenize = (input: string) => {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (character === undefined) {
      continue;
    }
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }
    if (character === '\\' && quote !== "'") {
      const next = input[index + 1];
      if (
        next !== undefined &&
        (/\s/.test(next) || next === '"' || next === "'" || next === '\\')
      ) {
        escaped = true;
        continue;
      }
      current += character;
      continue;
    }
    if (quote) {
      if (character === quote) {
        quote = null;
      } else {
        current += character;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += character;
  }

  if (current) {
    tokens.push(current);
  }
  return tokens;
};

const splitCommands = (input: string) => {
  const joined = input.replace(/\\\r?\n/g, ' ');
  const lines = joined.split(/\r?\n/);
  const commands: string[] = [];
  let current = '';

  const finish = () => {
    if (current.trim()) {
      commands.push(current.trim());
    }
    current = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      finish();
      continue;
    }
    if (
      /^(?:\$\s*)?(?:sudo\s+)?docker(?:\s+container)?\s+run\b/.test(trimmed)
    ) {
      finish();
      current = trimmed;
    } else if (current) {
      current += ` ${trimmed}`;
    }
  }
  finish();
  return commands;
};

const sanitizeName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '') || 'service';

const nameFromImage = (image: string) => {
  const withoutDigest = image.split('@')[0] ?? image;
  const lastPart = withoutDigest.split('/').pop() ?? 'service';
  const withoutTag = lastPart.split(':')[0] ?? lastPart;
  return sanitizeName(withoutTag);
};

const quote = (value: string) => JSON.stringify(value);

const parseCommand = (command: string): ParsedService | null => {
  const tokens = tokenize(command);
  let cursor = 0;
  const skip = (expected: string) => {
    if (tokens[cursor]?.toLowerCase() === expected) {
      cursor += 1;
      return true;
    }
    return false;
  };

  skip('$');
  skip('sudo');
  if (!skip('docker')) {
    return null;
  }
  skip('container');
  if (!skip('run')) {
    return null;
  }

  const args = tokens.slice(cursor);
  const service: ParsedService = {
    name: '',
    image: '',
    ports: [],
    volumes: [],
    environment: [],
    envFiles: [],
    networks: [],
    command: [],
  };

  let image: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (token === undefined) {
      continue;
    }

    if (image !== undefined) {
      service.command.push(token);
      continue;
    }

    if (token === '--') {
      const next = args[index + 1];
      if (next !== undefined) {
        image = next;
        index += 1;
      }
      continue;
    }

    if (!token.startsWith('-') || token === '-') {
      image = token;
      continue;
    }

    let flag = token;
    let inlineValue: string | undefined;

    if (token.startsWith('--')) {
      const equals = token.indexOf('=');
      if (equals > 2) {
        flag = token.slice(0, equals);
        inlineValue = token.slice(equals + 1);
      }
    } else {
      const short = SHORT_VALUE_FLAGS.find(
        (candidate) =>
          token.startsWith(candidate) && token.length > candidate.length
      );
      if (short) {
        flag = short;
        inlineValue = token.slice(short.length);
      }
    }

    if (!VALUE_FLAGS.has(flag)) {
      continue;
    }

    let value = inlineValue;
    if (value === undefined) {
      value = args[index + 1];
      if (value === undefined) {
        continue;
      }
      index += 1;
    }

    switch (flag) {
      case '-p':
      case '--publish':
        service.ports.push(value);
        break;
      case '-v':
      case '--volume':
        service.volumes.push(value);
        break;
      case '-e':
      case '--env':
        service.environment.push(value);
        break;
      case '--env-file':
        service.envFiles.push(value);
        break;
      case '--name':
        service.containerName = value;
        break;
      case '--network':
      case '--net':
        service.networks.push(value);
        break;
      case '--restart':
        service.restart = value;
        break;
      case '--hostname':
      case '-h':
        service.hostname = value;
        break;
      case '-w':
      case '--workdir':
        service.workingDir = value;
        break;
      case '-u':
      case '--user':
        service.user = value;
        break;
      case '--entrypoint':
        service.entrypoint = value;
        break;
      default:
        break;
    }
  }

  if (!image) {
    return null;
  }
  service.image = image;
  return service;
};

const parseDockerRun = (input: string): ParseResult => {
  const commands = splitCommands(input);
  const warnings: string[] = [];
  const parsed: ParsedService[] = [];

  commands.forEach((command, index) => {
    const service = parseCommand(command);
    if (service) {
      parsed.push(service);
    } else {
      warnings.push(
        `Command ${index + 1} has no image or is not a docker run command.`
      );
    }
  });

  const usedNames = new Set<string>();
  for (const service of parsed) {
    const base = service.containerName
      ? sanitizeName(service.containerName)
      : nameFromImage(service.image);
    let name = base;
    let suffix = 2;
    while (usedNames.has(name)) {
      name = `${base}-${suffix}`;
      suffix += 1;
    }
    usedNames.add(name);
    service.name = name;
  }

  if (parsed.length === 0) {
    return { services: [], warnings, yaml: '' };
  }

  const lines: string[] = [
    '# Generated by CoderTools',
    '# docker run → docker-compose.yml',
    '',
    'services:',
  ];

  for (const service of parsed) {
    lines.push(`  ${service.name}:`);
    lines.push(`    image: ${quote(service.image)}`);
    if (service.containerName) {
      lines.push(`    container_name: ${quote(service.containerName)}`);
    }
    if (service.hostname) {
      lines.push(`    hostname: ${quote(service.hostname)}`);
    }
    if (service.restart) {
      lines.push(`    restart: ${quote(service.restart)}`);
    }
    if (service.workingDir) {
      lines.push(`    working_dir: ${quote(service.workingDir)}`);
    }
    if (service.user) {
      lines.push(`    user: ${quote(service.user)}`);
    }
    if (service.entrypoint) {
      lines.push(`    entrypoint: ${quote(service.entrypoint)}`);
    }

    if (service.ports.length > 0) {
      lines.push('    ports:');
      for (const port of service.ports) {
        lines.push(`      - ${quote(port)}`);
      }
    }
    if (service.volumes.length > 0) {
      lines.push('    volumes:');
      for (const volume of service.volumes) {
        lines.push(`      - ${quote(volume)}`);
      }
    }
    if (service.envFiles.length > 0) {
      lines.push('    env_file:');
      for (const file of service.envFiles) {
        lines.push(`      - ${quote(file)}`);
      }
    }
    if (service.environment.length > 0) {
      lines.push('    environment:');
      for (const variable of service.environment) {
        lines.push(`      - ${quote(variable)}`);
      }
    }
    if (service.command.length > 0) {
      lines.push(`    command: [${service.command.map(quote).join(', ')}]`);
    }

    const specialNetwork = service.networks.find(
      (network) => network === 'host' || network === 'none'
    );
    if (specialNetwork) {
      lines.push(`    network_mode: ${quote(specialNetwork)}`);
    } else {
      const networks = [...new Set(service.networks)].filter(
        (network) => network !== 'bridge'
      );
      if (networks.length > 0) {
        lines.push('    networks:');
        for (const network of networks) {
          lines.push(`      - ${quote(network)}`);
        }
      }
    }
  }

  const networks = [
    ...new Set(
      parsed.flatMap((service) =>
        service.networks.filter(
          (network) =>
            network !== 'bridge' && network !== 'host' && network !== 'none'
        )
      )
    ),
  ];

  if (networks.length > 0) {
    lines.push('', 'networks:');
    for (const network of networks) {
      lines.push(`  ${network}:`);
      lines.push(`    name: ${quote(network)}`);
    }
  }

  return { services: parsed, warnings, yaml: lines.join('\n') };
};

const SAMPLE = `docker run -d --name web -p 8080:80 -v ./site:/usr/share/nginx/html:ro -e NGINX_HOST=example.com nginx:alpine

docker run -d --name api --network appnet -p 3000:3000 -v ./data:/app/data -e DATABASE_URL=postgres://db:5432/app --restart unless-stopped myapp/api:latest`;

export default function DockerComposeTool() {
  const [input, setInput] = useState(SAMPLE);

  const result = useMemo(() => parseDockerRun(input), [input]);
  const error =
    result.services.length === 0
      ? 'Paste at least one docker run command to convert.'
      : null;

  return (
    <ToolLayout>
      <Panel
        description="Paste one command, or separate multiple commands with a blank line. Backslash line continuations are supported."
        title="docker run commands"
      >
        <div className="space-y-3">
          <Field
            hint={`${result.services.length} service${result.services.length === 1 ? '' : 's'} detected`}
            label="Commands"
          >
            <Textarea
              aria-label="docker run commands"
              onChange={(event) => setInput(event.target.value)}
              placeholder="docker run -d -p 8080:80 nginx:alpine"
              style={{ minHeight: 260 }}
              value={input}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setInput(SAMPLE)}
              size="sm"
              variant="primary"
            >
              Load example
            </Button>
            <Button onClick={() => setInput('')} size="sm" variant="ghost">
              Clear
            </Button>
          </div>

          {error && (
            <Callout variant="warning" title="No services found">
              {error}
            </Callout>
          )}

          {result.warnings.map((warning) => (
            <Callout key={warning} variant="error">
              {warning}
            </Callout>
          ))}

          {result.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.services.map((service) => (
                <Badge key={service.name} variant="accent">
                  {service.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="rounded-md border border-border bg-canvas-inset px-3 py-2 text-xs leading-5 text-fg-muted">
            Supported flags include <code>-p</code>, <code>-v</code>,{' '}
            <code>-e</code>, <code>--name</code>, <code>--network</code>,{' '}
            <code>--restart</code>, <code>--hostname</code>,{' '}
            <code>--workdir</code>, <code>--user</code>, <code>--env-file</code>{' '}
            and <code>--entrypoint</code>. Other flags are ignored. Named
            networks are declared with an explicit name so Compose creates them
            if missing; switch to <code>external: true</code> if the network
            already exists. Compose interpolates <code>$</code> in YAML, so use{' '}
            <code>$$</code> for a literal dollar sign.
          </div>
        </div>
      </Panel>

      <ResultPanel
        error={error}
        filename="docker-compose.yml"
        label="docker-compose.yml"
        mime="text/yaml;charset=utf-8"
        value={result.yaml}
      />
    </ToolLayout>
  );
}
