import type { CategoryModule } from '@/components/tools/types';

import CodeScreenshot from './code-screenshot';
import CurlFetch from './curl-fetch';
import GraphqlFormatter from './graphql-formatter';
import HtmlToJsx from './html-to-jsx';
import ImportSorter from './import-sorter';
import LessCompiler from './less-compiler';
import PythonFormatter from './python-formatter';
import RemoveConsoleLog from './remove-console-log';
import ScssCompiler from './scss-compiler';
import SqlFormatter from './sql-formatter';
import StripComments from './strip-comments';
import StylusCompiler from './stylus-compiler';
import SyntaxHighlighter from './syntax-highlighter';
import TailwindSorter from './tailwind-sorter';
import TypescriptToJavascript from './typescript-to-javascript';

export const components: CategoryModule['components'] = {
  'sql-formatter': SqlFormatter,
  'graphql-formatter': GraphqlFormatter,
  'scss-compiler': ScssCompiler,
  'less-compiler': LessCompiler,
  'stylus-compiler': StylusCompiler,
  'tailwind-sorter': TailwindSorter,
  'strip-comments': StripComments,
  'remove-console-log': RemoveConsoleLog,
  'import-sorter': ImportSorter,
  'syntax-highlighter': SyntaxHighlighter,
  'code-screenshot': CodeScreenshot,
  'typescript-to-javascript': TypescriptToJavascript,
  'html-to-jsx': HtmlToJsx,
  'curl-fetch': CurlFetch,
  'python-formatter': PythonFormatter,
};
