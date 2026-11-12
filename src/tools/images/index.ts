import type { CategoryModule } from '@/components/tools/types';

import BarcodeGenerator from './barcode-generator';
import ColorExtractor from './color-extractor';
import ExifViewer from './exif-viewer';
import FaviconGenerator from './favicon-generator';
import ImageCompressor from './image-compressor';
import ImageConverter from './image-converter';
import ImageResizer from './image-resizer';
import PlaceholderImage from './placeholder-image';
import QrGenerator from './qr-generator';
import SvgOptimizer from './svg-optimizer';
import SvgToPng from './svg-to-png';

export const components: CategoryModule['components'] = {
  'image-compressor': ImageCompressor,
  'image-resizer': ImageResizer,
  'image-converter': ImageConverter,
  'svg-to-png': SvgToPng,
  'svg-optimizer': SvgOptimizer,
  'favicon-generator': FaviconGenerator,
  'placeholder-image': PlaceholderImage,
  'exif-viewer': ExifViewer,
  'color-extractor': ColorExtractor,
  'qr-generator': QrGenerator,
  'barcode-generator': BarcodeGenerator,
};
