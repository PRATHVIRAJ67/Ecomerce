/**
 * Edge entry for the URU website on Cloudflare Workers.
 *  - /media/<path>        → images from the R2 bucket `uru-media` (product, category & banner photos)
 *  - /download/<file>.apk → streamed from the private R2 bucket `uru-downloads` (supports Range/resume, HEAD, ETag)
 *  - everything else      → the static Vite build (SPA fallback is handled by the assets config)
 */
interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}
interface R2ObjectLike {
  size: number;
  httpEtag: string;
  uploaded: Date;
  range?: R2Range;
  body?: ReadableStream;
  writeHttpMetadata(headers: Headers): void;
}
interface Bucket {
  head(key: string): Promise<R2ObjectLike | null>;
  get(key: string, options?: { range?: Headers; onlyIf?: Headers }): Promise<R2ObjectLike | null>;
}
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  MEDIA: Bucket;
  APP_FILES: {
    head(key: string): Promise<R2ObjectLike | null>;
    get(key: string, options?: { range?: Headers; onlyIf?: Headers }): Promise<R2ObjectLike | null>;
  };
}

const FILE = /^[a-z0-9][a-z0-9._-]{0,80}\.apk$/i;
const MEDIA_KEY = /^[a-z0-9][a-z0-9/._-]{0,200}\.(jpe?g|png|webp|avif)$/i;
const IMAGE_TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

async function serveMedia(request: Request, env: Env, key: string): Promise<Response> {
  if (!MEDIA_KEY.test(key) || key.includes('..')) return new Response('Not found', { status: 404 });
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const object = request.method === 'HEAD' ? await env.MEDIA.head(key) : await env.MEDIA.get(key, { onlyIf: request.headers });
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', IMAGE_TYPES[key.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream');
  headers.set('ETag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=2592000');
  headers.set('Access-Control-Allow-Origin', '*'); // images are public; lets the admin & mobile apps load them
  headers.set('X-Content-Type-Options', 'nosniff');
  if (request.method === 'HEAD' || !object.body) return new Response(null, { status: object.body || request.method === 'HEAD' ? 200 : 304, headers });
  return new Response(object.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/media/')) return serveMedia(request, env, decodeURIComponent(url.pathname.slice('/media/'.length)));
    if (!url.pathname.startsWith('/download/')) return env.ASSETS.fetch(request);

    const key = decodeURIComponent(url.pathname.slice('/download/'.length));
    if (!FILE.test(key)) return new Response('Not found', { status: 404 });
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });

    const object = request.method === 'HEAD' ? await env.APP_FILES.head(key) : await env.APP_FILES.get(key, { range: request.headers, onlyIf: request.headers });
    if (!object) return new Response('Not found', { status: 404 });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('Content-Type', 'application/vnd.android.package-archive');
    headers.set('Content-Disposition', `attachment; filename="${key}"`);
    headers.set('ETag', object.httpEtag);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('X-Content-Type-Options', 'nosniff');
    // "latest" names change on every release; versioned names never do.
    headers.set('Cache-Control', /\d+\.\d+\.\d+/.test(key) ? 'public, max-age=31536000, immutable' : 'public, max-age=300');

    if (request.method === 'HEAD') {
      headers.set('Content-Length', String(object.size));
      return new Response(null, { headers });
    }
    if (!object.body) return new Response(null, { status: 304, headers }); // If-None-Match matched

    const r = object.range;
    if (r && request.headers.has('range')) {
      const start = r.suffix != null ? object.size - r.suffix : (r.offset ?? 0);
      const length = r.suffix != null ? r.suffix : (r.length ?? object.size - start);
      headers.set('Content-Range', `bytes ${start}-${start + length - 1}/${object.size}`);
      headers.set('Content-Length', String(length));
      return new Response(object.body, { status: 206, headers });
    }
    headers.set('Content-Length', String(object.size));
    return new Response(object.body, { headers });
  },
};
