import type { CategoryModule } from '@/components/tools/types';

import Formatter from './formatter';
import JsonToObject from './json-to-object';
import Minifier from './minifier';
import ObjectToJson from './object-to-json';
import Validator from './validator';

export const components: CategoryModule['components'] = {
  formatter: Formatter,
  minifier: Minifier,
  validator: Validator,
  'object-to-json': ObjectToJson,
  'json-to-object': JsonToObject,
};
