import type { ShikimoriAnime, ShikimoriScreenshot, ShikimoriCharacter, AgeRating, AnimeStatus } from '@/types';

const PROXY_BASE = '/api/shikimori';
const SHIKIMORI_IMG = 'https://shikimori.one';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function shikimoriFetch(
  path: string,
  params?: Record<string, string | string[] | undefined>,
  retries = 2,
): Promise<unknown> {
  const url = new URL(PROXY_BASE + path, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue;
      if (Array.isArray(value)) {
        url.searchParams.set(key, value.join(','));
      } else {
        url.searchParams.set(key, value);
      }
    }
  }

  const resp = await fetch(url.toString());

  if (resp.status === 429 && retries > 0) {
    await delay(1000);
    return shikimoriFetch(path, params, retries - 1);
  }

  if (!resp.ok) {
    throw new Error(`API error: ${resp.status} (${path})`);
  }

  return resp.json();
}

export function imageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SHIKIMORI_IMG + path;
}

export async function fetchAnimes(params: {
  page?: number;
  limit?: number;
  order?: string;
  kind?: string;
  status?: AnimeStatus | '';
  season?: string;
  score?: string;
  genre?: string;
  rating?: AgeRating | '';
  search?: string;
  mylist?: string;
}): Promise<ShikimoriAnime[]> {
  const query: Record<string, string | string[] | undefined> = {
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  };
  if (params.order) query.order = params.order;
  else if (!params.search) query.order = 'popularity';
  if (params.kind) query.kind = params.kind;
  if (params.status) query.status = params.status;
  if (params.season) query.season = params.season;
  if (params.score) query.score = params.score;
  if (params.genre) query.genre = params.genre;
  if (params.rating) query.rating = params.rating;
  if (params.search) query.search = params.search;
  if (params.mylist) query.mylist = params.mylist;

  const data = await shikimoriFetch('/animes', query);
  return data as ShikimoriAnime[];
}

export async function fetchAnimeById(id: number): Promise<ShikimoriAnime> {
  const data = await shikimoriFetch(`/animes/${id}`);
  return data as ShikimoriAnime;
}

export async function fetchScreenshots(id: number): Promise<ShikimoriScreenshot[]> {
  const data = await shikimoriFetch(`/animes/${id}/screenshots`);
  return data as ShikimoriScreenshot[];
}

export async function fetchCharacters(id: number): Promise<ShikimoriCharacter[]> {
  const data = await shikimoriFetch(`/animes/${id}/characters`);
  return data as ShikimoriCharacter[];
}

export async function fetchGenres(): Promise<{ id: number; name: string; russian: string; kind: string; }[]> {
  const data = await shikimoriFetch('/genres', { kind: 'anime' });
  return data as { id: number; name: string; russian: string; kind: string; }[];
}

export async function fetchTopScore(): Promise<ShikimoriAnime[]> {
  const data = await shikimoriFetch('/animes', {
    order: 'ranked',
    limit: '12',
    score: '7',
  });
  return data as ShikimoriAnime[];
}

export async function fetchSeasonal(): Promise<ShikimoriAnime[]> {
  await delay(350);
  const data = await shikimoriFetch('/animes', {
    order: 'popularity',
    limit: '12',
    status: 'ongoing',
  });
  return data as ShikimoriAnime[];
}

export async function fetchPopular(): Promise<ShikimoriAnime[]> {
  await delay(700);
  const data = await shikimoriFetch('/animes', {
    order: 'popularity',
    limit: '12',
  });
  return data as ShikimoriAnime[];
}

export async function fetchHomeData(): Promise<{
  top: ShikimoriAnime[];
  seasonal: ShikimoriAnime[];
  popular: ShikimoriAnime[];
}> {
  const [top, seasonal, popular] = await Promise.allSettled([
    fetchTopScore(),
    fetchSeasonal(),
    fetchPopular(),
  ]);
  if (top.status === 'rejected' && seasonal.status === 'rejected' && popular.status === 'rejected') {
    throw new Error('Не удалось загрузить данные');
  }
  return {
    top: top.status === 'fulfilled' ? top.value : [],
    seasonal: seasonal.status === 'fulfilled' ? seasonal.value : [],
    popular: popular.status === 'fulfilled' ? popular.value : [],
  };
}

export async function fetchFallbackPoster(id: number): Promise<string> {
  try {
    const r = await fetch(`https://api.jikan.moe/v4/anime/${id}`);
    const j = await r.json();
    return j.data?.images?.jpg?.large_image_url ?? '';
  } catch {
    return '';
  }
}

export const AGE_RATINGS: { value: AgeRating; label: string; }[] = [
  { value: 'none', label: 'Любой' },
  { value: 'g', label: 'G' },
  { value: 'pg', label: 'PG' },
  { value: 'pg_13', label: 'PG-13' },
  { value: 'r', label: 'R-17+' },
  { value: 'r_plus', label: 'R+' },
];

export function ratingBadge(rating: string | undefined): { label: string; color: string } | null {
  if (!rating) return null;
  const map: Record<string, { label: string; color: string }> = {
    'g': { label: 'G', color: 'bg-green-500/90' },
    'pg': { label: 'PG', color: 'bg-blue-500/90' },
    'pg_13': { label: 'PG-13', color: 'bg-yellow-500/90 text-black' },
    'r': { label: 'R-17+', color: 'bg-orange-500/90' },
    'r_plus': { label: 'R+', color: 'bg-red-500/90' },
    'rx': { label: 'Rx', color: 'bg-red-700/90' },
    'none': { label: '', color: '' },
  };
  return map[rating.toLowerCase()] ?? null;
}

// ==================== ANIVOX INTEGRATION ====================

const ANIVOX_BASE = '/api/anivox';

export interface AnivoxDubber {
  id: number;
  name: string;
  team?: string;
}

export interface AnivoxStreamResponse {
  links: Record<string, string>;
  skips?: { opening?: number[] | null; ending?: number[] | null };
  thumbnail?: string | null;
}

export async function fetchAnivoxDubbers(shikimoriId: number): Promise<AnivoxDubber[]> {
  try {
    const resp = await fetch(`${ANIVOX_BASE}/anime/${shikimoriId}?with_dubbers=1`);
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.translations ?? data.dubbers ?? []) as AnivoxDubber[];
  } catch {
    return [];
  }
}

export async function fetchAnivoxStream(
  shikimoriId: number,
  episode: number,
  dubberId: number,
): Promise<AnivoxStreamResponse | null> {
  try {
    const url = `${ANIVOX_BASE}/episodes/${shikimoriId}/${episode}?dubber=${dubberId}&room_id=&with_kodik=false`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = (await resp.json()) as AnivoxStreamResponse;
    if (data.links) {
      for (const q of Object.keys(data.links)) {
        if (data.links[q].startsWith('//')) data.links[q] = 'https:' + data.links[q];
      }
    }
    return data;
  } catch {
    return null;
  }
}
