import type { CategoryModule } from '@/components/tools/types';

import Base32 from './base32';
import Base64 from './base64';
import Base64FileToDataUri from './base64-file-to-data-uri';
import Base64UrlSafe from './base64-url-safe';
import BinaryToText from './binary-to-text';
import Hex from './hex';
import MorseCode from './morse-code';
import Octal from './octal';
import PunycodeIdn from './punycode-idn';
import QuotedPrintable from './quoted-printable';
import Rot13Caesar from './rot13-caesar';
import StringEscaper from './string-escaper';
import UnicodeEscape from './unicode-escape';
import UrlEncoder from './url-encoder';

export const components: CategoryModule['components'] = {
  base32: Base32,
  base64: Base64,
  'base64-url-safe': Base64UrlSafe,
  'base64-file-to-data-uri': Base64FileToDataUri,
  hex: Hex,
  'binary-to-text': BinaryToText,
  octal: Octal,
  'unicode-escape': UnicodeEscape,
  'rot13-caesar': Rot13Caesar,
  'morse-code': MorseCode,
  'punycode-idn': PunycodeIdn,
  'quoted-printable': QuotedPrintable,
  'string-escaper': StringEscaper,
  'url-encoder': UrlEncoder,
};
