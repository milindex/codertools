'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Panel } from '@/components/ui/Panel';
import { ResultPanel } from '@/components/ui/ResultPanel';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Textarea } from '@/components/ui/Textarea';
import { ToolLayout } from '@/components/ui/ToolLayout';

type TreeNode = {
  name: string;
  directories: Map<string, TreeNode>;
  files: Map<string, string | null>;
};

const createNode = (name: string): TreeNode => ({
  name,
  directories: new Map(),
  files: new Map(),
});

const SIZE_PATTERN = /^\d+(?:\.\d+)?\s*(?:B|KB|MB|GB|TB|KiB|MiB|GiB|TiB)?$/i;
const PAREN_SIZE_PATTERN =
  /\s+\((\d+(?:\.\d+)?\s*(?:B|KB|MB|GB|TB|KiB|MiB|GiB|TiB)?)\)$/i;

type ParsedPath = {
  segments: string[];
  size: string | null;
  directory: boolean;
};

const parseLine = (rawLine: string): ParsedPath | null => {
  let line = rawLine.trim();
  if (!line || line.startsWith('#')) {
    return null;
  }

  line = line.replace(/\\/g, '/');

  let size: string | null = null;
  const parenMatch = PAREN_SIZE_PATTERN.exec(line);
  if (parenMatch?.[1]) {
    size = parenMatch[1].trim();
    line = line.slice(0, parenMatch.index).trim();
  } else {
    const separatorMatch = /^(.*?)\s*(?:\||\t)\s*(.+)$/.exec(line);
    if (separatorMatch?.[1] && separatorMatch[2]) {
      const candidate = separatorMatch[2].trim();
      if (SIZE_PATTERN.test(candidate)) {
        size = candidate;
        line = separatorMatch[1].trim();
      }
    }
  }

  const directory = line.endsWith('/');
  const segments = line.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }

  return { segments, size, directory };
};

const sortEntries = (
  entries: Array<{ kind: 'dir' | 'file'; name: string; size: string | null }>,
  foldersFirst: boolean,
  sortMode: 'name' | 'type'
) =>
  [...entries].sort((a, b) => {
    if (sortMode === 'type' && a.kind !== b.kind) {
      return a.kind === 'dir' ? -1 : 1;
    }
    if (foldersFirst && a.kind !== b.kind) {
      return a.kind === 'dir' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

const renderTree = (
  root: TreeNode,
  options: {
    foldersFirst: boolean;
    showSizes: boolean;
    sortMode: 'name' | 'type';
  }
) => {
  const lines: string[] = [root.name];

  const walk = (node: TreeNode, prefix: string) => {
    const entries: Array<{
      kind: 'dir' | 'file';
      name: string;
      size: string | null;
    }> = [
      ...Array.from(node.directories.values()).map((child) => ({
        kind: 'dir' as const,
        name: child.name,
        size: null,
      })),
      ...Array.from(node.files.entries()).map(([name, size]) => ({
        kind: 'file' as const,
        name,
        size,
      })),
    ];

    const sorted = sortEntries(entries, options.foldersFirst, options.sortMode);

    sorted.forEach((entry, index) => {
      const last = index === sorted.length - 1;
      const connector = last ? '└── ' : '├── ';
      const sizePart = options.showSizes && entry.size ? `  ${entry.size}` : '';
      lines.push(`${prefix}${connector}${entry.name}${sizePart}`);
      if (entry.kind === 'dir') {
        const child = node.directories.get(entry.name);
        if (child) {
          walk(child, `${prefix}${last ? '    ' : '│   '}`);
        }
      }
    });
  };

  walk(root, '');
  return lines.join('\n');
};

export default function DirectoryTree() {
  const [paths, setPaths] = useState('');
  const [rootName, setRootName] = useState('project');
  const [foldersFirst, setFoldersFirst] = useState(true);
  const [showSizes, setShowSizes] = useState(true);
  const [sortMode, setSortMode] = useState<'name' | 'type'>('type');

  const parsed = useMemo(() => {
    const root = createNode(rootName.trim() || 'root');
    let skipped = 0;

    for (const rawLine of paths.split(/\r?\n/)) {
      if (!rawLine.trim()) {
        continue;
      }
      const parsedLine = parseLine(rawLine);
      if (!parsedLine) {
        skipped += 1;
        continue;
      }

      let current = root;
      const { segments, size, directory } = parsedLine;
      segments.forEach((segment, index) => {
        const isLast = index === segments.length - 1;
        if (isLast) {
          if (directory) {
            current.files.delete(segment);
            if (!current.directories.has(segment)) {
              current.directories.set(segment, createNode(segment));
            }
            return;
          }
          if (current.directories.has(segment)) {
            return;
          }
          if (current.files.has(segment)) {
            // Keep the first non-empty size if duplicate file lines appear.
            const existing = current.files.get(segment);
            if (!existing && size) {
              current.files.set(segment, size);
            }
          } else {
            current.files.set(segment, size);
          }
          return;
        }

        const existing = current.directories.get(segment);
        if (existing) {
          current = existing;
        } else {
          const created = createNode(segment);
          current.files.delete(segment);
          current.directories.set(segment, created);
          current = created;
        }
      });
    }

    const countTree = (node: TreeNode): { files: number; sizes: number } => {
      let files = 0;
      let sizes = 0;
      for (const size of node.files.values()) {
        files += 1;
        if (size) {
          sizes += 1;
        }
      }
      for (const child of node.directories.values()) {
        const nested = countTree(child);
        files += nested.files;
        sizes += nested.sizes;
      }
      return { files, sizes };
    };

    const counts = countTree(root);

    return {
      root,
      fileCount: counts.files,
      sizeCount: counts.sizes,
      skipped,
    };
  }, [paths, rootName]);

  const tree = useMemo(
    () =>
      paths.trim()
        ? renderTree(parsed.root, { foldersFirst, showSizes, sortMode })
        : '',
    [parsed.root, paths, foldersFirst, showSizes, sortMode]
  );

  const hasSizes = parsed.sizeCount > 0 && showSizes;

  return (
    <div className="space-y-4">
      <ToolLayout>
        <Panel
          description="Paste one path per line. Optionally add a size with a pipe or tab, or in parentheses."
          title="Paths"
        >
          <Field
            hint="Example: src/index.ts | 1.2 KB"
            htmlFor="tree-paths"
            label="File paths"
          >
            <Textarea
              className="min-h-[300px]"
              id="tree-paths"
              onChange={(event) => setPaths(event.target.value)}
              placeholder={
                'src/index.ts | 1.2 KB\nsrc/components/Button.tsx | 3.4 KB\nREADME.md | 2 KB\npackage.json'
              }
              value={paths}
            />
          </Field>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field htmlFor="tree-root" label="Root label">
              <Input
                id="tree-root"
                onChange={(event) => setRootName(event.target.value)}
                placeholder="project"
                value={rootName}
              />
            </Field>
            <Field htmlFor="tree-sort" label="Sort by">
              <SegmentedControl
                ariaLabel="Sort tree entries"
                className="w-full"
                onChange={(value) =>
                  setSortMode(value === 'type' ? 'type' : 'name')
                }
                options={[
                  { value: 'type', label: 'Type' },
                  { value: 'name', label: 'Name' },
                ]}
                value={sortMode}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-fg">
              <input
                checked={foldersFirst}
                className="accent-[var(--accent)]"
                onChange={(event) => setFoldersFirst(event.target.checked)}
                type="checkbox"
              />
              Folders first
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-fg">
              <input
                checked={showSizes}
                className="accent-[var(--accent)]"
                onChange={(event) => setShowSizes(event.target.checked)}
                type="checkbox"
              />
              Show file sizes
            </label>
            <Button
              onClick={() => {
                setPaths('');
                setRootName('project');
              }}
              size="sm"
              variant="ghost"
            >
              Clear
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                setPaths(
                  [
                    'src/index.ts | 1.2 KB',
                    'src/components/Button.tsx | 3.4 KB',
                    'src/components/Input.tsx | 1.1 KB',
                    'src/utils/format.ts | 800 B',
                    'public/favicon.ico | 15 KB',
                    'README.md | 2 KB',
                    'package.json | 1.4 KB',
                    'tsconfig.json | 700 B',
                  ].join('\n')
                )
              }
              size="sm"
            >
              Load example
            </Button>
            <span className="self-center text-xs text-fg-muted">
              {parsed.fileCount} file{parsed.fileCount === 1 ? '' : 's'} parsed
            </span>
          </div>

          {!paths.trim() && (
            <Callout className="mt-3" variant="info">
              Paste paths to build a tree. Existing directory prefixes are
              merged automatically.
            </Callout>
          )}
          {parsed.skipped > 0 && (
            <Callout className="mt-3" variant="warning">
              {parsed.skipped} line{parsed.skipped === 1 ? '' : 's'} could not
              be parsed and were skipped.
            </Callout>
          )}
        </Panel>

        <div className="space-y-4">
          <ResultPanel
            emptyText="Your directory tree will appear here."
            filename="directory-tree.txt"
            label="ASCII tree"
            value={tree}
          />

          <Panel title="Details">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-fg-muted">Files</dt>
                <dd className="mt-0.5 font-semibold text-fg">
                  {parsed.fileCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Top-level entries</dt>
                <dd className="mt-0.5 font-semibold text-fg">
                  {parsed.root.directories.size + parsed.root.files.size}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Sizes shown</dt>
                <dd className="mt-0.5 font-semibold text-fg">
                  {hasSizes ? 'Yes' : 'No'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Sort</dt>
                <dd className="mt-0.5 font-semibold capitalize text-fg">
                  {sortMode}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-fg-muted">
              Accepted size formats include <code>file.ts | 12 KB</code>, a
              tab-separated size, and <code>file.ts (12 KB)</code>.
            </p>
          </Panel>
        </div>
      </ToolLayout>
    </div>
  );
}
