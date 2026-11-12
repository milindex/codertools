'use client';

import { useMemo, useState } from 'react';
import type { SemVer } from 'semver';
import {
  compare,
  diff as semverDiff,
  minVersion,
  parse,
  Range,
  satisfies,
  validRange,
} from 'semver';

import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToolLayout } from '@/components/ui/ToolLayout';

import { DetailList, Examples, ReasonList, Verdict } from './shared';

type Mode = 'inspect' | 'compare' | 'range';

const parseVersion = (value: string): SemVer | null => {
  try {
    return parse(value.trim());
  } catch {
    return null;
  }
};

const canonicalVersion = (version: SemVer): string => {
  const prerelease =
    version.prerelease.length > 0 ? `-${version.prerelease.join('.')}` : '';
  const build = version.build.length > 0 ? `+${version.build.join('.')}` : '';
  return `${version.major}.${version.minor}.${version.patch}${prerelease}${build}`;
};

const INVALID_VERSION =
  'A semantic version needs MAJOR.MINOR.PATCH, with optional -prerelease and +build parts. Example: 2.1.0-rc.1+build.7.';

export default function SemverValidator() {
  const [mode, setMode] = useState<Mode>('inspect');
  const [versionInput, setVersionInput] = useState('');
  const [otherInput, setOtherInput] = useState('');
  const [rangeInput, setRangeInput] = useState('');

  const inspect = useMemo(() => {
    const raw = versionInput.trim();
    if (!raw) {
      return null;
    }
    const parsed = parseVersion(raw);
    if (!parsed) {
      return {
        valid: false,
        errors: [
          `"${raw}" is not a valid semantic version. ${INVALID_VERSION}`,
        ],
        parsed: null,
        canonical: '',
      };
    }
    return {
      valid: true,
      errors: [] as string[],
      parsed,
      canonical: canonicalVersion(parsed),
    };
  }, [versionInput]);

  const comparison = useMemo(() => {
    const first = versionInput.trim();
    const second = otherInput.trim();
    if (!first || !second) {
      return null;
    }

    const errors: string[] = [];
    const firstVersion = parseVersion(first);
    const secondVersion = parseVersion(second);

    if (!firstVersion) {
      errors.push(`First version "${first}" is not valid. ${INVALID_VERSION}`);
    }
    if (!secondVersion) {
      errors.push(
        `Second version "${second}" is not valid. ${INVALID_VERSION}`
      );
    }
    if (!firstVersion || !secondVersion) {
      return {
        valid: false,
        errors,
        firstVersion: null,
        secondVersion: null,
        result: 0,
        relation: '',
        difference: null,
        firstCanonical: '',
        secondCanonical: '',
      };
    }

    const result = compare(firstVersion, secondVersion);
    let difference: string | null = null;
    try {
      difference = semverDiff(firstVersion, secondVersion);
    } catch {
      difference = null;
    }

    return {
      valid: true,
      errors: [] as string[],
      firstVersion,
      secondVersion,
      result,
      relation:
        result === 0 ? 'equal to' : result > 0 ? 'greater than' : 'less than',
      difference,
      firstCanonical: canonicalVersion(firstVersion),
      secondCanonical: canonicalVersion(secondVersion),
    };
  }, [versionInput, otherInput]);

  const rangeCheck = useMemo(() => {
    const versionText = versionInput.trim();
    const rangeText = rangeInput.trim();
    if (!versionText || !rangeText) {
      return null;
    }

    const errors: string[] = [];
    const parsed = parseVersion(versionText);
    let normalizedRange: string | null = null;

    if (!parsed) {
      errors.push(`Version "${versionText}" is not valid. ${INVALID_VERSION}`);
    }

    try {
      normalizedRange = validRange(rangeText);
    } catch {
      normalizedRange = null;
    }

    if (!normalizedRange) {
      errors.push(
        `"${rangeText}" is not a valid semver range. Try ^1.2.3, ~1.4.0, >=2.0.0 <3.0.0 or 1.x.`
      );
    }

    if (!parsed || !normalizedRange) {
      return {
        valid: false,
        errors,
        parsed: null,
        normalizedRange: '',
        satisfied: false,
        minimum: '',
        comparators: [] as string[],
      };
    }

    let satisfied = false;
    try {
      satisfied = satisfies(parsed, normalizedRange);
    } catch {
      satisfied = false;
    }

    let minimum = '';
    try {
      minimum = minVersion(normalizedRange)?.version ?? '';
    } catch {
      minimum = '';
    }

    let comparators: string[] = [];
    try {
      comparators = new Range(normalizedRange).set
        .map((set) => set.map((comparator) => comparator.value).join(' '))
        .filter((value) => value.length > 0);
    } catch {
      comparators = [];
    }

    return {
      valid: true,
      errors: [] as string[],
      parsed,
      normalizedRange,
      satisfied,
      minimum,
      comparators,
    };
  }, [versionInput, rangeInput]);

  const copyValue =
    mode === 'inspect'
      ? inspect?.valid
        ? inspect.canonical
        : ''
      : mode === 'compare'
        ? comparison?.valid
          ? `${comparison.firstCanonical} ${comparison.result === 0 ? '=' : comparison.result > 0 ? '>' : '<'} ${comparison.secondCanonical}`
          : ''
        : rangeCheck?.valid
          ? `${rangeCheck.parsed?.version ?? ''} ${rangeCheck.satisfied ? 'satisfies' : 'does not satisfy'} ${rangeCheck.normalizedRange}`
          : '';

  return (
    <ToolLayout>
      <Panel
        actions={
          <SegmentedControl
            ariaLabel="Semver mode"
            onChange={(value) => setMode(value as Mode)}
            options={[
              { label: 'Inspect', value: 'inspect' },
              { label: 'Compare', value: 'compare' },
              { label: 'Range', value: 'range' },
            ]}
            value={mode}
          />
        }
        description="Parses strict Semantic Versioning 2.0.0 strings, compares releases and tests ranges."
        title="Semantic version"
      >
        <div className="space-y-3">
          <Field
            hint={mode === 'range' ? 'Version to test' : 'Strict semver format'}
            label="Version"
          >
            <Input
              aria-label="Version"
              autoComplete="off"
              onChange={(event) => setVersionInput(event.target.value)}
              placeholder="1.2.3"
              spellCheck={false}
              type="text"
              value={versionInput}
            />
          </Field>

          {mode === 'compare' && (
            <Field hint="Compared with the first version" label="Compare with">
              <Input
                aria-label="Version to compare with"
                autoComplete="off"
                onChange={(event) => setOtherInput(event.target.value)}
                placeholder="2.0.0"
                spellCheck={false}
                type="text"
                value={otherInput}
              />
            </Field>
          )}

          {mode === 'range' && (
            <Field hint="npm-style range syntax" label="Range">
              <Input
                aria-label="Semver range"
                autoComplete="off"
                onChange={(event) => setRangeInput(event.target.value)}
                placeholder="^1.2.3"
                spellCheck={false}
                type="text"
                value={rangeInput}
              />
            </Field>
          )}
        </div>

        {mode === 'range' ? (
          <Examples
            items={['^1.2.3', '~1.4.0', '>=2.0.0 <3.0.0', '1.x || 2.x']}
            onPick={setRangeInput}
          />
        ) : (
          <Examples
            items={['1.2.3', '2.0.0-beta.1+build.5', 'v1.2.3']}
            onPick={setVersionInput}
          />
        )}
      </Panel>

      <ResultPanel
        emptyText={
          mode === 'compare'
            ? 'Enter two versions to compare them.'
            : mode === 'range'
              ? 'Enter a version and a range to test them.'
              : 'Enter a semantic version to inspect it.'
        }
        label="Result"
        value={copyValue}
      >
        {mode === 'inspect' && inspect && (
          <div className="space-y-3">
            <Verdict
              title={
                inspect.valid ? 'Valid semantic version' : 'Invalid version'
              }
              valid={inspect.valid}
            >
              {inspect.valid && inspect.parsed ? (
                <span>
                  <span className="font-mono">{inspect.canonical}</span> follows
                  the MAJOR.MINOR.PATCH rules.
                </span>
              ) : (
                <ReasonList items={inspect.errors} />
              )}
            </Verdict>

            {inspect.valid && inspect.parsed && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="accent">{inspect.parsed.major} major</Badge>
                  <Badge>{inspect.parsed.minor} minor</Badge>
                  <Badge>{inspect.parsed.patch} patch</Badge>
                  <Badge
                    variant={
                      inspect.parsed.prerelease.length > 0
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {inspect.parsed.prerelease.length > 0
                      ? 'Prerelease'
                      : 'Stable release'}
                  </Badge>
                </div>

                <DetailList
                  details={[
                    {
                      label: 'Canonical version',
                      value: inspect.canonical,
                      mono: true,
                      wide: true,
                      breakAll: true,
                    },
                    {
                      label: 'Major',
                      value: String(inspect.parsed.major),
                      mono: true,
                    },
                    {
                      label: 'Minor',
                      value: String(inspect.parsed.minor),
                      mono: true,
                    },
                    {
                      label: 'Patch',
                      value: String(inspect.parsed.patch),
                      mono: true,
                    },
                    {
                      label: 'Prerelease identifiers',
                      value:
                        inspect.parsed.prerelease.length > 0
                          ? inspect.parsed.prerelease.join('.')
                          : 'None',
                      mono: inspect.parsed.prerelease.length > 0,
                    },
                    {
                      label: 'Build metadata',
                      value:
                        inspect.parsed.build.length > 0
                          ? inspect.parsed.build.join('.')
                          : 'None',
                      mono: inspect.parsed.build.length > 0,
                    },
                  ]}
                />

                <p className="text-xs leading-5 text-fg-muted">
                  Build metadata is ignored when versions are compared. Leading
                  zeroes are not allowed in numeric identifiers, and a leading v
                  is accepted only as input normalization.
                </p>
              </>
            )}
          </div>
        )}

        {mode === 'compare' && comparison && (
          <div className="space-y-3">
            <Verdict
              title={
                comparison.valid ? 'Comparison result' : 'Invalid comparison'
              }
              valid={comparison.valid}
            >
              {comparison.valid && comparison.firstVersion ? (
                <span>
                  <span className="font-mono">{comparison.firstCanonical}</span>{' '}
                  is {comparison.relation}{' '}
                  <span className="font-mono">
                    {comparison.secondCanonical}
                  </span>
                  .
                </span>
              ) : (
                <ReasonList items={comparison.errors} />
              )}
            </Verdict>

            {comparison.valid && comparison.firstVersion && (
              <>
                <DetailList
                  details={[
                    {
                      label: 'First version',
                      value: comparison.firstCanonical,
                      mono: true,
                    },
                    {
                      label: 'Second version',
                      value: comparison.secondCanonical,
                      mono: true,
                    },
                    {
                      label: 'Sort position',
                      value:
                        comparison.result === 0
                          ? '0 (equal)'
                          : `${comparison.result} (${comparison.result > 0 ? 'first is higher' : 'first is lower'})`,
                      mono: true,
                    },
                    {
                      label: 'Difference',
                      value: comparison.difference ?? 'None (same version)',
                    },
                  ]}
                />

                <Callout variant="info" title="Comparison rules">
                  Major, minor and patch numbers are compared first, then
                  prerelease identifiers. A prerelease has lower precedence than
                  the corresponding release (1.0.0-rc.1 &lt; 1.0.0). Build
                  metadata is ignored.
                </Callout>
              </>
            )}
          </div>
        )}

        {mode === 'range' && rangeCheck && (
          <div className="space-y-3">
            <Verdict
              title={
                rangeCheck.valid
                  ? rangeCheck.satisfied
                    ? 'Version satisfies the range'
                    : 'Version does not satisfy the range'
                  : 'Invalid range input'
              }
              valid={rangeCheck.valid}
              variant={
                rangeCheck.valid
                  ? rangeCheck.satisfied
                    ? 'success'
                    : 'warning'
                  : 'error'
              }
            >
              {rangeCheck.valid && rangeCheck.parsed ? (
                <span>
                  <span className="font-mono">{rangeCheck.parsed.version}</span>{' '}
                  {rangeCheck.satisfied ? 'satisfies' : 'does not satisfy'}{' '}
                  <span className="font-mono">
                    {rangeCheck.normalizedRange}
                  </span>
                  .
                </span>
              ) : (
                <ReasonList items={rangeCheck.errors} />
              )}
            </Verdict>

            {rangeCheck.valid && rangeCheck.parsed && (
              <>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={rangeCheck.satisfied ? 'success' : 'danger'}>
                    {rangeCheck.satisfied ? 'Satisfied' : 'Not satisfied'}
                  </Badge>
                  {rangeCheck.minimum && (
                    <Badge>Minimum {rangeCheck.minimum}</Badge>
                  )}
                </div>

                <DetailList
                  details={[
                    {
                      label: 'Version',
                      value: rangeCheck.parsed.version,
                      mono: true,
                    },
                    {
                      label: 'Normalized range',
                      value: rangeCheck.normalizedRange,
                      mono: true,
                      wide: true,
                      breakAll: true,
                    },
                    {
                      label: 'Satisfies',
                      value: rangeCheck.satisfied ? 'Yes' : 'No',
                    },
                    {
                      label: 'Minimum version',
                      value: rangeCheck.minimum || 'Not bounded',
                      mono: true,
                    },
                    {
                      label: 'Range comparators',
                      value:
                        rangeCheck.comparators.length > 0
                          ? rangeCheck.comparators.join(' || ')
                          : 'Any version',
                      mono: true,
                      wide: true,
                      breakAll: true,
                    },
                  ]}
                />

                <p className="text-xs leading-5 text-fg-muted">
                  By default, prerelease versions do not satisfy ranges unless
                  the range includes a prerelease for the same major, minor and
                  patch tuple.
                </p>
              </>
            )}
          </div>
        )}
      </ResultPanel>
    </ToolLayout>
  );
}
