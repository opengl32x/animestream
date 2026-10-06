import { useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal, X, Loader2 } from 'lucide-react';
import type { ShikimoriAnime, AgeRating, AnimeStatus } from '@/types';
import { fetchAnimes, fetchGenres, AGE_RATINGS } from '@/lib/api';
import { AnimeCardList } from '@/components/AnimeCard';
import { CardGridSkeleton, ErrorState } from '@/components/Skeletons';
import { navigate } from '@/lib/router';

interface Filters {
  genre: string;
  year: string;
  status: AnimeStatus | '';
  rating: AgeRating | '';
  kind: string;
}

const DEFAULT_FILTERS: Filters = {
  genre: '',
  year: '',
  status: '',
  rating: '',
  kind: '',
};

const YEARS = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2015', '2010', '2005', '2000'];
const STATUSES: { value: AnimeStatus | ''; label: string }[] = [
  { value: '', label: 'Любой' },
  { value: 'ongoing', label: 'Онгоинг' },
  { value: 'released', label: 'Вышло' },
];
const KINDS: { value: string; label: string }[] = [
  { value: '', label: 'Все типы' },
  { value: 'tv', label: 'TV' },
  { value: 'movie', label: 'Фильм' },
  { value: 'ova', label: 'OVA' },
  { value: 'ona', label: 'ONA' },
  { value: 'special', label: 'Спешл' },
  { value: 'music', label: 'Клип' },
];

export function CatalogPage() {
  const [animes, setAnimes] = useState<ShikimoriAnime[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string; russian: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  const loadGenres = useCallback(async () => {
    try {
      const data = await fetchGenres();
      setGenres(data);
    } catch { /* genres are optional */ }
  }, []);

  useEffect(() => { loadGenres(); }, [loadGenres]);

  const loadAnimes = useCallback(async (pageNum: number, currentFilters: Filters, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const seasonParam = currentFilters.year ? `${currentFilters.year}` : undefined;
      const data = await fetchAnimes({
        page: pageNum,
        limit: 24,
        order: 'popularity',
        genre: currentFilters.genre || undefined,
        season: seasonParam,
        status: currentFilters.status || undefined,
        rating: currentFilters.rating || undefined,
        kind: currentFilters.kind || undefined,
      });
      if (append) {
        setAnimes(prev => [...prev, ...data]);
      } else {
        setAnimes(data);
      }
      setHasMore(data.length === 24);
    } catch {
      setError('Не удалось загрузить каталог. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    loadAnimes(1, filters, false);
  }, [filters, loadAnimes]);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const filterControls = () => (
    <div className="space-y-4">
      {/* Genre */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Жанр</label>
        <select
          value={filters.genre}
          onChange={e => updateFilter('genre', e.target.value)}
          className="w-full rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
        >
          <option value="">Все жанры</option>
          {genres.map(g => (
            <option key={g.id} value={String(g.id)}>{g.russian || g.name}</option>
          ))}
        </select>
      </div>

      {/* Year */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Год</label>
        <select
          value={filters.year}
          onChange={e => updateFilter('year', e.target.value)}
          className="w-full rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
        >
          {YEARS.map(y => (
            <option key={y} value={y}>{y || 'Любой'}</option>
          ))}
        </select>
      </div>

      {/* Kind */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Тип</label>
        <select
          value={filters.kind}
          onChange={e => updateFilter('kind', e.target.value)}
          className="w-full rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
        >
          {KINDS.map(k => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Статус</label>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => updateFilter('status', s.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filters.status === s.value
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-800/60 text-zinc-300 ring-1 ring-zinc-700/50 hover:bg-zinc-700/60'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Age Rating */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-400">Возрастной рейтинг</label>
        <div className="flex flex-wrap gap-2">
          {AGE_RATINGS.map(r => (
            <button
              key={r.value}
              onClick={() => updateFilter('rating', r.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filters.rating === r.value
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-800/60 text-zinc-300 ring-1 ring-zinc-700/50 hover:bg-zinc-700/60'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
        >
          <X className="h-4 w-4" /> Сбросить фильтры ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Каталог аниме</h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 ring-1 ring-zinc-700/50 transition hover:bg-zinc-700/60 lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Фильтры
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-rose-500 px-1.5 text-xs text-white">{activeFilterCount}</span>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 rounded-xl bg-zinc-900/60 p-4 ring-1 ring-zinc-800">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-rose-400" />
              <h2 className="text-sm font-semibold text-white">Фильтры</h2>
            </div>
            {filterControls()}
          </div>
        </aside>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowFilters(false)} />
            <div className="absolute left-0 top-0 h-full w-72 overflow-y-auto bg-zinc-900 p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Фильтры</h2>
                <button onClick={() => setShowFilters(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {filterControls()}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="min-w-0 flex-1">
          {error ? (
            <ErrorState message={error} onRetry={() => loadAnimes(1, filters, false)} />
          ) : loading ? (
            <CardGridSkeleton count={12} />
          ) : animes.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-zinc-500">Ничего не найдено по выбранным фильтрам</p>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="mt-3 text-sm text-rose-400 hover:text-rose-300">
                  Сбросить фильтры
                </button>
              )}
            </div>
          ) : (
            <>
              <AnimeCardList animes={animes} />
              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={() => {
                      const next = page + 1;
                      setPage(next);
                      loadAnimes(next, filters, true);
                    }}
                    disabled={loadingMore}
                    className="flex items-center gap-2 rounded-xl bg-zinc-800/60 px-6 py-3 text-sm font-medium text-zinc-200 ring-1 ring-zinc-700/50 transition hover:bg-zinc-700/60 disabled:opacity-50"
                  >
                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    Загрузить ещё
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
