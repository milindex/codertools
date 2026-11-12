import type { CategoryModule } from '@/components/tools/types';

import AsciiArt from './ascii-art';
import CaseConverter from './case-converter';
import FindReplaceRegex from './find-replace-regex';
import LineEndingNormalizer from './line-ending-normalizer';
import MarkdownPreview from './markdown-preview';
import MarkdownToHtml from './markdown-to-html';
import RegexExplainer from './regex-explainer';
import RegexTester from './regex-tester';
import RemoveDuplicateLines from './remove-duplicate-lines';
import Slugify from './slugify';
import SortLines from './sort-lines';
import StripHtml from './strip-html';
import TabsSpaces from './tabs-spaces';
import TextCounter from './text-counter';
import TextDiff from './text-diff';
import UnicodeInspector from './unicode-inspector';

export const components: CategoryModule['components'] = {
  'ascii-art': AsciiArt,
  'case-converter': CaseConverter,
  'find-replace-regex': FindReplaceRegex,
  'line-ending-normalizer': LineEndingNormalizer,
  'markdown-preview': MarkdownPreview,
  'markdown-to-html': MarkdownToHtml,
  'regex-explainer': RegexExplainer,
  'regex-tester': RegexTester,
  'remove-duplicate-lines': RemoveDuplicateLines,
  slugify: Slugify,
  'sort-lines': SortLines,
  'strip-html': StripHtml,
  'tabs-spaces': TabsSpaces,
  'text-counter': TextCounter,
  'text-diff': TextDiff,
  'unicode-inspector': UnicodeInspector,
};
