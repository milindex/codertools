import type { CategoryModule } from '@/components/tools/types';

import EntityEncoder from './entity-encoder';
import Formatter from './formatter';
import Minifier from './minifier';
import Preview from './preview';
import Validator from './validator';

export const components: CategoryModule['components'] = {
  formatter: Formatter,
  minifier: Minifier,
  validator: Validator,
  preview: Preview,
  'entity-encoder': EntityEncoder,
};
