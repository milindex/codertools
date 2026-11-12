import { cn } from '@/utils/cn';

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export const Logo = ({ className, showWordmark = true }: LogoProps) => (
  <span className={cn('inline-flex items-center gap-2', className)}>
    <svg
      aria-hidden="true"
      className="h-7 w-7 shrink-0"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#0d1117" height="64" rx="14" width="64" />
      <rect
        fill="none"
        height="62"
        rx="13"
        stroke="#30363d"
        strokeWidth="2"
        width="62"
        x="1"
        y="1"
      />
      <path
        d="M23 20.5 12 32l11 11.5"
        fill="none"
        stroke="#2f81f7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M33 43.5h17"
        fill="none"
        stroke="#e6edf3"
        strokeLinecap="round"
        strokeWidth="5"
      />
      <circle cx="50" cy="20.5" fill="#3fb950" r="3.5" />
    </svg>
    {showWordmark && (
      <span className="text-[15px] font-bold tracking-tight text-fg">
        Coder<span className="text-accent">Tools</span>
      </span>
    )}
  </span>
);
