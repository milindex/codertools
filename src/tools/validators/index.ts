import type { CategoryModule } from '@/components/tools/types';

import CreditCard from './credit-card';
import Cron from './cron';
import Email from './email';
import Iban from './iban';
import Ip from './ip';
import Isbn from './isbn';
import PasswordStrength from './password-strength';
import Phone from './phone';
import Semver from './semver';

export const components: CategoryModule['components'] = {
  email: Email,
  'credit-card': CreditCard,
  iban: Iban,
  isbn: Isbn,
  phone: Phone,
  ip: Ip,
  semver: Semver,
  'password-strength': PasswordStrength,
  cron: Cron,
};
