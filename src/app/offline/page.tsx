import { WifiOff } from 'lucide-react';
import type { Metadata } from 'next';

import { Container } from '@/components/ui/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { LinkButton } from '@/components/ui/LinkButton';

export const metadata: Metadata = {
  title: 'Offline',
  description:
    'This page is not cached for offline use yet. Reconnect or return to a page you have already visited.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OfflinePage() {
  return (
    <Container className="py-16">
      <EmptyState
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <LinkButton href="/" variant="primary">
              Go home
            </LinkButton>
            <LinkButton href="/tools/">Browse tools</LinkButton>
          </div>
        }
        description="This page is not cached for offline use yet. Reconnect to the internet, or open a page you have already visited. Pages you visit while online are cached for next time."
        icon={WifiOff}
        title="You are offline"
      />
    </Container>
  );
}
