import fs from 'node:fs';
import path from 'node:path';

const catalogSource = fs.readFileSync('src/data/catalog.ts', 'utf8');
const categoryMatches = [...catalogSource.matchAll(/id:\s*'([^']+)'/g)].map(
  (match) => ({
    id: match[1],
    index: match.index ?? 0,
    tools: [],
  })
);
const toolMatches = [
  ...catalogSource.matchAll(/tool\(\s*(['"])([^'"]+)\1/g),
].map((match) => ({
  slug: match[2],
  index: match.index ?? 0,
}));

for (const tool of toolMatches) {
  const category = [...categoryMatches]
    .reverse()
    .find((candidate) => candidate.index < tool.index);
  if (category) {
    category.tools.push(tool.slug);
  }
}

const categories = categoryMatches;

const missing = [];
const unmappedFiles = [];
let total = 0;

for (const category of categories) {
  total += category.tools.length;
  const indexPath = path.join('src/tools', category.id, 'index.ts');
  if (!fs.existsSync(indexPath)) {
    missing.push(`${category.id}: missing index.ts`);
    continue;
  }

  const indexSource = fs.readFileSync(indexPath, 'utf8');
  const componentsAt = indexSource.indexOf('components');
  const open = indexSource.indexOf('{', componentsAt);
  const close = indexSource.lastIndexOf('};');
  const body = indexSource.slice(open + 1, close);
  const keys = new Set();

  for (const line of body.split(/\r?\n/)) {
    const match = line.match(
      /^\s*(?:'([^']+)'|([a-z0-9-]+))\s*:\s*[A-Za-z0-9_]+/
    );
    if (match) {
      keys.add(match[1] || match[2]);
    }
  }

  for (const slug of category.tools) {
    if (!keys.has(slug)) {
      missing.push(`${category.id}/${slug}`);
    }
  }

  for (const key of keys) {
    if (!category.tools.includes(key)) {
      unmappedFiles.push(`${category.id}/${key}`);
    }
  }
}

console.log(
  `categories=${categories.length} tools=${total} mapped=${total - missing.length} missing=${missing.length} unexpected=${unmappedFiles.length}`
);

if (missing.length > 0) {
  console.error('\nMissing components:');
  for (const item of missing) console.error(`- ${item}`);
}

if (unmappedFiles.length > 0) {
  console.warn('\nComponents not in the catalog:');
  for (const item of unmappedFiles) console.warn(`- ${item}`);
}

process.exitCode = missing.length > 0 ? 1 : 0;
