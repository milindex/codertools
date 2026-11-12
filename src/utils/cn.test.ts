import { cn } from '@/utils/cn';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('returns an empty string when nothing is provided', () => {
    expect(cn()).toBe('');
  });
});
