import type { AnimeStatus } from '@/types';

export function AnimeCardSkeleton() {
  return (
    <div className="group relative w-full overflow-hidden rounded-xl bg-zinc-900/80 ring-1 ring-zinc-800 animate-pulse">
      <div className="aspect-[3/4] w-full bg-zinc-800/70" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-full rounded bg-zinc-800/70" />
        <div className="h-3 w-2/3 rounded bg-zinc-800/70" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-12 rounded bg-zinc-800/70" />
          <div className="h-5 w-10 rounded bg-zinc-800/70" />
        </div>
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <AnimeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 h-8 w-48 rounded-lg bg-zinc-800/70 animate-pulse" />
      <CardGridSkeleton />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-full bg-red-500/10 p-4">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-zinc-400 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/30"
        >
          Повторить
        </button>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: AnimeStatus }) {
  if (status === 'ongoing') {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300 ring-1 ring-emerald-500/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Онгоинг
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-sky-500/20">
      Вышло
    </span>
  );
}
