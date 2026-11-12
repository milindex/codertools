'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type LicenseChoice = 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'none';

const badgeText = (value: string) =>
  value.replace(/-/g, '--').replace(/_/g, '__').replace(/ /g, '_');

const LICENSE_NAMES: Record<Exclude<LicenseChoice, 'none'>, string> = {
  MIT: 'MIT License',
  'Apache-2.0': 'Apache License 2.0',
  'GPL-3.0': 'GNU General Public License v3.0',
};

export default function ReadmeGenerator() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [install, setInstall] = useState('npm install');
  const [usage, setUsage] = useState('');
  const [usageLanguage, setUsageLanguage] = useState('bash');
  const [tech, setTech] = useState('TypeScript, React, Next.js');
  const [features, setFeatures] = useState('');
  const [license, setLicense] = useState<LicenseChoice>('MIT');
  const [includeBadges, setIncludeBadges] = useState(true);

  const techList = useMemo(
    () =>
      tech
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    [tech]
  );

  const featureList = useMemo(
    () =>
      features
        .split(/\r?\n/)
        .map((item) => item.replace(/^[-*]\s*/, '').trim())
        .filter((item) => item.length > 0),
    [features]
  );

  const readme = useMemo(() => {
    const title = name.trim();
    if (!title) {
      return '';
    }

    const lines: string[] = [`# ${title}`];

    if (description.trim()) {
      lines.push('', description.trim());
    }

    const badges: string[] = [];
    if (includeBadges) {
      if (license !== 'none') {
        badges.push(
          `![License](https://img.shields.io/badge/license-${badgeText(
            LICENSE_NAMES[license]
          )}-blue)`
        );
      }
      for (const item of techList) {
        badges.push(
          `![${item}](https://img.shields.io/badge/-${badgeText(
            item
          )}-informational?style=flat-square)`
        );
      }
    }
    if (badges.length > 0) {
      lines.push('', badges.join(' '));
    }

    if (repoUrl.trim()) {
      lines.push('', `[View the repository](${repoUrl.trim()})`);
    }

    if (featureList.length > 0) {
      lines.push('', '## Features', '');
      for (const feature of featureList) {
        lines.push(`- ${feature}`);
      }
    }

    if (install.trim()) {
      lines.push('', '## Installation', '', '```bash', install.trim(), '```');
    }

    if (usage.trim()) {
      lines.push(
        '',
        '## Usage',
        '',
        `\`\`\`${usageLanguage}`,
        usage.trim(),
        '```'
      );
    }

    if (techList.length > 0) {
      lines.push('', '## Tech Stack', '');
      for (const item of techList) {
        lines.push(`- ${item}`);
      }
    }

    if (license !== 'none') {
      lines.push(
        '',
        '## License',
        '',
        `Distributed under the ${LICENSE_NAMES[license]}. See \`LICENSE\` for more information.`
      );
    }

    return lines.join('\n');
  }, [
    name,
    description,
    includeBadges,
    license,
    techList,
    repoUrl,
    featureList,
    install,
    usage,
    usageLanguage,
  ]);

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Fill in the sections you want. Empty sections are omitted from the Markdown."
          title="Project details"
        >
          <Field
            error={!name.trim() ? 'A project name is required.' : undefined}
            htmlFor="readme-name"
            label="Project name"
          >
            <Input
              id="readme-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="My Awesome Project"
              value={name}
            />
          </Field>

          <Field
            className="mt-4"
            hint="A short one-line summary"
            htmlFor="readme-description"
            label="Description"
          >
            <Textarea
              className="min-h-[70px]"
              id="readme-description"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A fast, privacy-friendly tool that runs entirely in the browser."
              value={description}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="readme-repo" label="Repository URL">
              <Input
                id="readme-repo"
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/user/repo"
                value={repoUrl}
              />
            </Field>
            <Field htmlFor="readme-license" label="License">
              <Select
                id="readme-license"
                onChange={(event) =>
                  setLicense(event.target.value as LicenseChoice)
                }
                value={license}
              >
                <option value="MIT">MIT</option>
                <option value="Apache-2.0">Apache 2.0</option>
                <option value="GPL-3.0">GPL 3.0</option>
                <option value="none">No license section</option>
              </Select>
            </Field>
          </div>

          <Field
            className="mt-4"
            hint="One per line"
            htmlFor="readme-features"
            label="Features"
          >
            <Textarea
              className="min-h-[90px]"
              id="readme-features"
              onChange={(event) => setFeatures(event.target.value)}
              placeholder={'Runs offline\nNo tracking\nKeyboard friendly'}
              value={features}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="readme-install" label="Install command">
              <Input
                id="readme-install"
                onChange={(event) => setInstall(event.target.value)}
                placeholder="npm install"
                value={install}
              />
            </Field>
            <Field htmlFor="readme-tech" label="Tech stack">
              <Input
                id="readme-tech"
                onChange={(event) => setTech(event.target.value)}
                placeholder="TypeScript, React"
                value={tech}
              />
            </Field>
          </div>

          <Field
            className="mt-4"
            hint="Comma-separated"
            htmlFor="readme-usage"
            label="Usage snippet"
          >
            <Textarea
              className="min-h-[100px]"
              id="readme-usage"
              onChange={(event) => setUsage(event.target.value)}
              placeholder={'npm run dev\nopen http://localhost:3000'}
              value={usage}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="readme-lang" label="Usage code language">
              <Select
                id="readme-lang"
                onChange={(event) => setUsageLanguage(event.target.value)}
                value={usageLanguage}
              >
                <option value="bash">bash</option>
                <option value="sh">sh</option>
                <option value="js">JavaScript</option>
                <option value="ts">TypeScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="text">Plain text</option>
              </Select>
            </Field>
            <label className="flex cursor-pointer items-center gap-2 self-end pb-1 text-sm text-fg">
              <input
                checked={includeBadges}
                className="accent-[var(--accent)]"
                onChange={(event) => setIncludeBadges(event.target.checked)}
                type="checkbox"
              />
              Include shields.io badges
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="accent">Markdown</Badge>
            <Badge>{techList.length} tech</Badge>
            <Badge>{featureList.length} features</Badge>
            <Button
              onClick={() => {
                setName('');
                setDescription('');
                setRepoUrl('');
                setFeatures('');
                setUsage('');
              }}
              size="sm"
              variant="ghost"
            >
              Clear content
            </Button>
          </div>

          {!name.trim() && (
            <Callout className="mt-3" variant="warning">
              Enter a project name to generate the README.
            </Callout>
          )}
        </Panel>

        <ResultPanel
          emptyText="Your README will appear here once a project name is entered."
          filename="README.md"
          label="README.md"
          mime="text/markdown;charset=utf-8"
          value={readme}
        />
      </ToolLayout>
    </div>
  );
}
