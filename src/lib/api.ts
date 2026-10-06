import type { ShikimoriAnime, ShikimoriScreenshot, ShikimoriCharacter, AgeRating, AnimeStatus } from '@/types';

// Перенаправляем запросы через Vercel Rewrite (/api/shikimori из vercel.json)
const PROXY_BASE = '/api/shikimori';
const SHIKIMORI_IMG = 'https://shikimori.one';
const KODIK_PLAYER_BASE = 'https://kodik.cc/players/player?shikimori_id=';

async function shikimoriFetch(path: string, params?: Record<string, string | string[] | undefined>): Promise<unknown> {
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

  // Убираем заголовки (User-Agent и Content-Type), так как Vercel сам проксирует запрос
  const resp = await fetch(url.toString());

  if (!resp.ok) {
    throw new Error(`API error: ${resp.status}`);
  }

  return resp.json();
}

export function imageUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return SHIKIMORI_IMG + path;
}

export function kodikPlayerUrl(shikimoriId: number | string, translationId?: string): string {
  const prioritize = 'anilibria,studio_band,dubbing';
  let url = `${KODIK_PLAYER_BASE}${shikimoriId}&prioritize_translations=${prioritize}&season=1`;
  if (translationId) {
    url += `&translation_id=${translationId}`;
  }
  return url;
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
    order: params.order ?? 'popularity',
  };
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
    order: 'score',
    limit: '12',
    status: 'released',
    score: '7',
  });
  return data as ShikimoriAnime[];
}

export async function fetchSeasonal(): Promise<ShikimoriAnime[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const seasonName = month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall';
  const data = await shikimoriFetch('/animes', {
    order: 'popularity',
    limit: '12',
    season: `${year}_${seasonName}`,
    status: 'ongoing',
  });
  return data as ShikimoriAnime[];
}

export async function fetchPopular(): Promise<ShikimoriAnime[]> {
  const data = await shikimoriFetch('/animes', {
    order: 'popularity',
    limit: '12',
  });
  return data as ShikimoriAnime[];
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
