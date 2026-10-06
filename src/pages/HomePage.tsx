import { useEffect, useState, useCallback } from 'react';
import { Flame, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import type { ShikimoriAnime } from '@/types';
import { fetchPopular, fetchSeasonal, fetchTopScore } from '@/lib/api';
import { AnimeCardList } from '@/components/AnimeCard';
import { CardGridSkeleton, ErrorState } from '@/components/Skeletons';
import { navigate } from '@/lib/router';

export function HomePage() {
  const [seasonal, setSeasonal] = useState<ShikimoriAnime[]>([]);
  const [popular, setPopular] = useState<ShikimoriAnime[]>([]);
  const [topScore, setTopScore] = useState<ShikimoriAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [seasonalData, popularData, topData] = await Promise.all([
        fetchSeasonal(),
        fetchPopular(),
        fetchTopScore(),
      ]);
      setSeasonal(seasonalData);
      setPopular(popularData);
      setTopScore(topData);
    } catch {
      setError('Не удалось загрузить данные. Проверьте подключение к интернету.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;

  const sectionHeader = (icon: React.ReactNode, title: string, subtitle: string) => (
    <div className="mb-4 flex items-end justify-between">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-rose-500/10 p-2 text-rose-400">{icon}</div>
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={() => navigate({ name: 'catalog' })}
        className="flex items-center gap-1 text-sm text-zinc-400 transition hover:text-rose-400"
      >
        Все <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-600/20 via-zinc-900 to-zinc-900 p-8 sm:p-12 ring-1 ring-zinc-800">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(244,63,94,0.15), transparent 50%)',
        }} />
        <div className="relative">
          <h1 className="text-3xl font-bold text-white sm:text-5xl">
            Смотри аниме <span className="text-rose-500">бесплатно</span>
          </h1>
          <p className="mt-3 max-w-xl text-zinc-400 text-sm sm:text-base">
            Огромный каталог тайтлов с русской озвучкой. Фильтруй по жанрам, возрастному рейтингу и статусу. Сохраняй в закладки и оставляй отзывы.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => navigate({ name: 'catalog' })}
              className="rounded-xl bg-rose-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-500/20"
            >
              Открыть каталог
            </button>
          </div>
        </div>
      </div>

      {/* Seasonal */}
      <section>
        {sectionHeader(<Flame className="h-5 w-5" />, 'Сейчас выходит', 'Популярные онгоинги этого сезона')}
        {loading ? <CardGridSkeleton /> : <AnimeCardList animes={seasonal} />}
      </section>

      {/* Popular */}
      <section>
        {sectionHeader(<Sparkles className="h-5 w-5" />, 'Популярное', 'Самые просматриваемые тайтлы')}
        {loading ? <CardGridSkeleton /> : <AnimeCardList animes={popular} />}
      </section>

      {/* Top Score */}
      <section>
        {sectionHeader(<TrendingUp className="h-5 w-5" />, 'Топ по рейтингу', 'Высоко оценённые аниме')}
        {loading ? <CardGridSkeleton /> : <AnimeCardList animes={topScore} />}
      </section>
    </div>
  );
}
