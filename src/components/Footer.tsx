import { TrendingUp } from 'lucide-react';
import { navigate } from '@/lib/router';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800/80 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600">
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white">
              Ani<span className="text-rose-500">Stream</span>
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <button onClick={() => navigate({ name: 'catalog' })} className="transition hover:text-zinc-300">
              Каталог
            </button>
            <span className="flex items-center gap-1">
              Данные предоставлены
              <a href="https://shikimori.one" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300">
                Shikimori
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
