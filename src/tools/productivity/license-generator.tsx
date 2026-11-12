'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { LICENSE_TEXTS, type LicenseId } from './license-texts';

const LICENSES: Array<{
  id: LicenseId;
  name: string;
  spdx: string;
  summary: string;
}> = [
  {
    id: 'mit',
    name: 'MIT',
    spdx: 'MIT',
    summary:
      'Short and permissive. Allows reuse with attribution and no warranty.',
  },
  {
    id: 'apache-2.0',
    name: 'Apache 2.0',
    spdx: 'Apache-2.0',
    summary:
      'Permissive with an explicit patent grant and attribution requirements.',
  },
  {
    id: 'gpl-3.0',
    name: 'GPL 3.0',
    spdx: 'GPL-3.0-only',
    summary:
      'Strong copyleft. Derivatives distributed publicly must remain GPL.',
  },
];

const fillTemplate = (
  template: string,
  year: string,
  author: string,
  project: string
) =>
  template
    .trimStart()
    .replaceAll('{year}', year.trim() || 'YYYY')
    .replaceAll('{author}', author.trim() || 'Copyright holder')
    .replaceAll('{project}', project.trim() || 'Project');

export default function LicenseGenerator() {
  const [license, setLicense] = useState<LicenseId>('mit');
  const [year, setYear] = useState(() => String(new Date().getFullYear()));
  const [author, setAuthor] = useState('');
  const [project, setProject] = useState('');

  const selected = LICENSES.find((item) => item.id === license) ?? LICENSES[0];

  const output = useMemo(() => {
    const template = LICENSE_TEXTS[license];
    return fillTemplate(template, year, author, project);
  }, [license, year, author, project]);

  const missingFields = !year.trim() || !author.trim();

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Choose a license and fill in the copyright details. The full canonical license text is generated locally."
          title="License details"
        >
          <div className="space-y-2">
            {LICENSES.map((item) => (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                  license === item.id
                    ? 'border-accent/60 bg-accent-subtle/30'
                    : 'border-border bg-canvas-subtle/30 hover:border-fg-subtle'
                }`}
                key={item.id}
              >
                <input
                  checked={license === item.id}
                  className="mt-1 accent-[var(--accent)]"
                  name="license"
                  onChange={() => setLicense(item.id)}
                  type="radio"
                  value={item.id}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-fg">
                      {item.name}
                    </span>
                    <Badge>{item.spdx}</Badge>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-fg-muted">
                    {item.summary}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              error={!year.trim() ? 'A year is required.' : undefined}
              htmlFor="license-year"
              label="Year"
            >
              <Input
                id="license-year"
                onChange={(event) => setYear(event.target.value)}
                placeholder="2026"
                value={year}
              />
            </Field>
            <Field
              error={
                !author.trim() ? 'A copyright holder is required.' : undefined
              }
              htmlFor="license-author"
              label="Copyright holder"
            >
              <Input
                id="license-author"
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Ada Lovelace"
                value={author}
              />
            </Field>
          </div>

          <Field
            className="mt-4"
            hint="Used for the GPL copyright notice"
            htmlFor="license-project"
            label="Project name"
          >
            <Input
              id="license-project"
              onChange={(event) => setProject(event.target.value)}
              placeholder="My project"
              value={project}
            />
          </Field>

          {missingFields ? (
            <Callout className="mt-3" variant="warning">
              Add a year and copyright holder so the generated license is ready
              to commit. Placeholders are used for any missing values.
            </Callout>
          ) : (
            <Callout className="mt-3" variant="success">
              Ready to save as a <code>LICENSE</code> file in your repository
              root.
            </Callout>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="accent">{selected?.spdx}</Badge>
            <Badge>{selected?.name}</Badge>
            <Badge variant="success">Full text</Badge>
          </div>

          <p className="mt-4 text-xs leading-5 text-fg-muted">
            This generator is informational and does not provide legal advice.
            Check the license terms for your project and jurisdiction.
          </p>
        </Panel>

        <ResultPanel
          emptyText="The license text will appear here."
          filename="LICENSE"
          label={`${selected?.name ?? 'License'} text`}
          mime="text/plain;charset=utf-8"
          value={output}
        />
      </ToolLayout>
    </div>
  );
}
