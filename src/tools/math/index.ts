import type { CategoryModule } from '@/components/tools/types';

import AspectRatio from './aspect-ratio';
import BaseConverter from './base-converter';
import BigInteger from './big-integer';
import BitwiseCalculator from './bitwise-calculator';
import DataSizeConverter from './data-size-converter';
import GraphingCalculator from './graphing-calculator';
import HexDump from './hex-dump';
import Ieee754 from './ieee754';
import PercentageCalculator from './percentage-calculator';
import PrimeFactorizer from './prime-factorizer';
import RomanNumeral from './roman-numeral';
import ScientificCalculator from './scientific-calculator';
import TwosComplement from './twos-complement';
import UnitConverter from './unit-converter';

export const components: CategoryModule['components'] = {
  'base-converter': BaseConverter,
  'bitwise-calculator': BitwiseCalculator,
  'twos-complement': TwosComplement,
  ieee754: Ieee754,
  'roman-numeral': RomanNumeral,
  'big-integer': BigInteger,
  'scientific-calculator': ScientificCalculator,
  'graphing-calculator': GraphingCalculator,
  'percentage-calculator': PercentageCalculator,
  'prime-factorizer': PrimeFactorizer,
  'unit-converter': UnitConverter,
  'data-size-converter': DataSizeConverter,
  'aspect-ratio': AspectRatio,
  'hex-dump': HexDump,
};
