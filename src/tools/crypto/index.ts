import type { CategoryModule } from '@/components/tools/types';

import Aes from './aes';
import Bcrypt from './bcrypt';
import CertificateViewer from './certificate-viewer';
import Crc32 from './crc32';
import FileHash from './file-hash';
import Hmac from './hmac';
import Md5 from './md5';
import PemDer from './pem-der';
import RsaKeyPair from './rsa-key-pair';
import Sha from './sha';

export const components: CategoryModule['components'] = {
  aes: Aes,
  bcrypt: Bcrypt,
  'certificate-viewer': CertificateViewer,
  crc32: Crc32,
  'file-hash': FileHash,
  hmac: Hmac,
  md5: Md5,
  'pem-der': PemDer,
  'rsa-key-pair': RsaKeyPair,
  sha: Sha,
};
