import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { HomeEntryPage } from './HomeEntryPage';

const StyleguidePage = lazy(() => import('../dev/ui/StyleguidePage'));

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <HomeEntryPage />,
  },
  {
    path: '/dev/ui',
    element: (
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-5xl flex-col gap-3 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        <StyleguidePage />
      </Suspense>
    ),
  },
]);
