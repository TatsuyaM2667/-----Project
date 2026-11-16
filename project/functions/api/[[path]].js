// Pages Functions: /api/* をバックエンドの Python Worker へ転送する（同一オリジンなのでCORS不要）
const API_ORIGIN = 'https://stratum-geo-bim-api.miuranosuketatsuya06.workers.dev';

export function onRequest({ request }) {
  const url = new URL(request.url);
  return fetch(new Request(API_ORIGIN + url.pathname + url.search, request));
}
