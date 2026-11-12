import { Search } from 'lucide-react';
import type { Metadata } from 'next';

import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <Container className="py-16">
      <EmptyState
        action={
          <LinkButton href="/tools" variant="primary">
            Browse all tools
          </LinkButton>
        }
        description="The page you are looking for does not exist. Try searching the tool catalog instead."
        icon={Search}
        title="Page not found"
      />
    </Container>
  );
}
