import type { ShikimoriAnime } from '@/types';
import { imageUrl, ratingBadge } from '@/lib/api';
import { navigate } from '@/lib/router';
import { StatusBadge } from '@/components/Skeletons';
import { Star, Play } from 'lucide-react';

interface AnimeCardProps {
  anime: ShikimoriAnime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const badge = ratingBadge(anime.rating);
  const title = anime.russian || anime.name;

  return (
    <div
      onClick={() => navigate({ name: 'anime', id: anime.id })}
      className="group relative cursor-pointer overflow-hidden rounded-xl bg-zinc-900/80 ring-1 ring-zinc-800 transition-all duration-300 hover:ring-2 hover:ring-rose-500/50 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-1"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <img
          src={imageUrl(anime.image.original)}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="rounded-full bg-rose-500/90 p-3 backdrop-blur-sm">
            <Play className="h-6 w-6 text-white" fill="white" />
          </div>
        </div>

        {/* Score badge */}
        {anime.score && anime.score !== '0.0' && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-yellow-400 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-yellow-400" />
            {anime.score}
          </div>
        )}

        {/* Age rating badge */}
        {badge && badge.label && (
          <div className={`absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${badge.color} backdrop-blur-sm`}>
            {badge.label}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute bottom-2 left-2">
          <StatusBadge status={anime.status} />
        </div>
      </div>

      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-zinc-100 transition-colors group-hover:text-rose-400" title={title}>
          {title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500" title={anime.name}>
          {anime.name}
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
          <span>{anime.kind === 'tv' ? 'TV' : anime.kind?.toUpperCase()}</span>
          {anime.episodes > 0 && (
            <>
              <span className="text-zinc-700">·</span>
              <span>{anime.episodes} эп.</span>
            </>
          )}
          {anime.aired_on && (
            <>
              <span className="text-zinc-700">·</span>
              <span>{anime.aired_on.slice(0, 4)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnimeCardList({ animes }: { animes: ShikimoriAnime[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </div>
  );
}
