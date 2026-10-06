import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
  const { path: _p, ...rest } = req.query;
  const query = new URLSearchParams(rest as Record<string, string>).toString();
  const target = `https://anivox.fun/api/${path}${query ? '?' + query : ''}`;

  try {
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://anivox.fun/',
        'Origin': 'https://anivox.fun',
        'Accept': 'application/json, text/plain, */*',
      },
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    const data = await upstream.text();

    res
      .status(upstream.status)
      .setHeader('Content-Type', contentType)
      .setHeader('Access-Control-Allow-Origin', '*')
      .send(data);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message, target });
  }
}
