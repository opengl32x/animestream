import type { VercelRequest, VercelResponse } from '@vercel/node';

const abs = (link: unknown): string => {
  if (typeof link !== 'string' || !link) return '';
  return link.startsWith('//') ? 'https:' + link : link;
};

// Функция расшифровки зашифрованных HLS-ссылок Kodik (ROT13 + Base64)
function decodeKodikUrl(url: string): string {
  if (!url) return '';
  const rot13 = url.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
  );
  try {
    return Buffer.from(rot13, 'base64').toString('utf-8');
  } catch {
    return rot13;
  }
}

// Извлечение прямой .m3u8 ссылки из HTML-кода плеера Kodik
async function getDirectHls(iframeUrl: string): Promise<string | null> {
  try {
    const res = await fetch(iframeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://kodik.info/'
      }
    });
    const html = await res.text();
    const match = html.match(/urlParams\s*=\s*['"]([^'"]+)['"]/);
    if (match && match[1]) {
      const decoded = decodeKodikUrl(match[1]);
      return decoded.startsWith('http') ? decoded : `https:${decoded}`;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = String(req.query.shikimori_id ?? '');
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'shikimori_id required' });
  }

  const token = process.env.KODIK_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'KODIK_TOKEN is not set' });
  }

  const params = new URLSearchParams({
    token,
    shikimori_id: id,
    with_episodes: 'true',
    types: 'anime,anime-serial',
    limit: '100',
  });

  try {
    const upstream = await fetch(`https://kodik-api.com/search?${params}`, { method: 'POST' });
    if (!upstream.ok) {
      return res.status(502).json({ error: `kodik ${upstream.status}` });
    }
    const data = (await upstream.json()) as { results?: any[] };

    const seen = new Set<string>();
    const dubs: any[] = [];

    for (const r of data.results ?? []) {
      const tid = r.translation?.id;
      const key = String(tid ?? r.id);
      if (seen.has(key)) continue;
      seen.add(key);

      const iframeLink = abs(r.link);
      // Достаем прямую hlsUrl ссылку
      const hlsUrl = await getDirectHls(iframeLink);

      const season: any = r.seasons ? Object.values(r.seasons)[0] : null;
      const episodes: Record<string, string> | null = season?.episodes
        ? Object.fromEntries(
            Object.entries(season.episodes as Record<string, any>).map(([n, e]) => [
              n,
              abs(typeof e === 'string' ? e : e?.link)
            ]),
          )
        : null;

      dubs.push({
        id: tid,
        name: r.translation?.title ?? 'Озвучка',
        type: r.translation?.type ?? 'voice',
        link: hlsUrl || iframeLink, // Ставим HLS-ссылку, если она есть
        episodes,
      });
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(dubs);
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
}
