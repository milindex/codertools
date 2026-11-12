import type { CategoryModule } from '@/components/tools/types';

import BusinessDays from './business-days';
import CronExplainer from './cron-explainer';
import CronParser from './cron-parser';
import DateDifference from './date-difference';
import DurationFormatter from './duration-formatter';
import TimestampConverter from './timestamp-converter';
import TimezoneConverter from './timezone-converter';

export const components: CategoryModule['components'] = {
  'timestamp-converter': TimestampConverter,
  'timezone-converter': TimezoneConverter,
  'cron-parser': CronParser,
  'cron-explainer': CronExplainer,
  'date-difference': DateDifference,
  'business-days': BusinessDays,
  'duration-formatter': DurationFormatter,
};
