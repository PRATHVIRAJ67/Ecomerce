import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

/** Router-level error boundary: render crashes and failed lazy chunk loads (e.g. after a redeploy). */
export function RouteError() {
  const error = useRouteError();
  const chunkFailed = error instanceof Error && /dynamically imported module|Loading chunk|Importing a module script failed/i.test(error.message);
  const status = isRouteErrorResponse(error) ? error.status : null;
  if (import.meta.env.DEV) console.error(error);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-6xl font-semibold text-forest-700">{status ?? 'Oops'}</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">{chunkFailed ? 'A new version of URU is available' : 'Something went wrong'}</h1>
        <p className="mt-2 text-ink-soft">{chunkFailed ? 'Please reload the page to continue.' : 'An unexpected error occurred. Reloading usually fixes it.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-xl bg-forest-700 px-5 text-sm font-semibold text-cream hover:bg-forest-800">
            Reload page
          </button>
          <Link to="/" reloadDocument className="inline-flex h-11 items-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-forest-800">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
