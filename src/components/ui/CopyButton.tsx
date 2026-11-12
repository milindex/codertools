'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';

type CopyButtonProps = {
  value: string;
  label?: string;
  className?: string;
};

const fallbackCopy = (value: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

export const CopyButton = ({
  value,
  label = 'Copy',
  className,
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        fallbackCopy(value);
      }
      setCopied(true);
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      fallbackCopy(value);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <Button
      aria-label={copied ? 'Copied' : label}
      className={className}
      disabled={!value}
      onClick={copy}
      size="sm"
      variant="ghost"
    >
      {copied ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : label}
    </Button>
  );
};
