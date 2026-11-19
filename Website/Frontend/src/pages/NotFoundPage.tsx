import { Compass } from 'lucide-react';
import { ButtonLink, EmptyState } from '../components/ui';
import { Seo } from '../lib/seo';

export default function NotFoundPage() {
  return (
    <div className="container-page py-12">
      <Seo title="Page not found" noindex />
      <EmptyState
        icon={Compass}
        title="This path leads nowhere"
        action={
          <>
            <ButtonLink to="/">Back to home</ButtonLink>
            <ButtonLink to="/shop" variant="outline">
              Browse the shop
            </ButtonLink>
          </>
        }
      >
        The page you're looking for doesn't exist or has moved.
      </EmptyState>
    </div>
  );
}
