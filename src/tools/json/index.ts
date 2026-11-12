import type { CategoryModule } from '@/components/tools/types';

import Formatter from './formatter';
import Minifier from './minifier';
import TreeViewer from './tree-viewer';
import Validator from './validator';

export const components: CategoryModule['components'] = {
  formatter: Formatter,
  minifier: Minifier,
  validator: Validator,
  'tree-viewer': TreeViewer,
};
