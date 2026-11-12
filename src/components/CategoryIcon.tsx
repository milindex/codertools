import type { LucideIcon } from 'lucide-react';
import {
  Binary,
  Braces,
  Calculator,
  CheckCircle,
  Clock,
  Code2,
  Database,
  FileJson,
  GitBranch,
  Globe,
  Image,
  KeyRound,
  Paintbrush,
  Palette,
  Shield,
  Terminal,
  Type,
  Wand2,
} from 'lucide-react';

import { cn } from '@/utils/cn';

const icons: Record<string, LucideIcon> = {
  code: Code2,
  palette: Palette,
  braces: Braces,
  'file-json': FileJson,
  binary: Binary,
  shield: Shield,
  'key-round': KeyRound,
  'wand-sparkles': Wand2,
  type: Type,
  database: Database,
  terminal: Terminal,
  'swatch-book': Paintbrush,
  calculator: Calculator,
  clock: Clock,
  globe: Globe,
  image: Image,
  'check-circle': CheckCircle,
  'git-branch': GitBranch,
};

export const CategoryIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const Icon = icons[name] ?? Code2;
  return <Icon aria-hidden className={cn('h-5 w-5', className)} />;
};
