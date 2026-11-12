import type { CategoryModule } from '@/components/tools/types';

import AsciiTable from './ascii-table';
import ConventionalCommit from './conventional-commit';
import CurrencyFormatter from './currency-formatter';
import DiffViewer from './diff-viewer';
import DirectoryTree from './directory-tree';
import EmojiPicker from './emoji-picker';
import LicenseGenerator from './license-generator';
import LogViewer from './log-viewer';
import MermaidPreview from './mermaid-preview';
import Pomodoro from './pomodoro';
import ReadmeGenerator from './readme-generator';
import StackTrace from './stack-trace';

export const components: CategoryModule['components'] = {
  'conventional-commit': ConventionalCommit,
  'diff-viewer': DiffViewer,
  'directory-tree': DirectoryTree,
  'ascii-table': AsciiTable,
  'mermaid-preview': MermaidPreview,
  'license-generator': LicenseGenerator,
  'readme-generator': ReadmeGenerator,
  'log-viewer': LogViewer,
  'stack-trace': StackTrace,
  pomodoro: Pomodoro,
  'emoji-picker': EmojiPicker,
  'currency-formatter': CurrencyFormatter,
};
