import type { CategoryModule } from '@/components/tools/types';

import ApiKey from './api-key';
import Diceware from './diceware';
import FakeData from './fake-data';
import LoremIpsum from './lorem-ipsum';
import Nanoid from './nanoid';
import Password from './password';
import RandomString from './random-string';
import SnowflakeDecoder from './snowflake-decoder';
import Ulid from './ulid';
import Uuid from './uuid';

export const components: CategoryModule['components'] = {
  uuid: Uuid,
  ulid: Ulid,
  nanoid: Nanoid,
  'snowflake-decoder': SnowflakeDecoder,
  'random-string': RandomString,
  password: Password,
  diceware: Diceware,
  'api-key': ApiKey,
  'lorem-ipsum': LoremIpsum,
  'fake-data': FakeData,
};
