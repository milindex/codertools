import type { CategoryModule } from '@/components/tools/types';

import Formatter from './formatter';
import Minifier from './minifier';
import PxRem from './px-rem';
import ToTailwind from './to-tailwind';
import Validator from './validator';

export const components: CategoryModule['components'] = {
  formatter: Formatter,
  minifier: Minifier,
  validator: Validator,
  'to-tailwind': ToTailwind,
  'px-rem': PxRem,
};
