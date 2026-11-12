import type { CategoryModule } from '@/components/tools/types';

import BasicAuth from './basic-auth';
import CookieParser from './cookie-parser';
import JwtInspector from './jwt-inspector';
import JwtSigner from './jwt-signer';
import Pkce from './pkce';
import Totp from './totp';

export const components: CategoryModule['components'] = {
  'basic-auth': BasicAuth,
  'cookie-parser': CookieParser,
  'jwt-inspector': JwtInspector,
  'jwt-signer': JwtSigner,
  pkce: Pkce,
  totp: Totp,
};
