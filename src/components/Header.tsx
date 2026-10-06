import { useEffect, useRef, useState } from 'react';
import { Search, X, LayoutGrid, User as UserIcon, LogOut, Home as HomeIcon } from 'lucide-react';
import type { ShikimoriAnime } from '@/types';
import { fetchAnimes, imageUrl } from '@/lib/api';
import { navigate, useRoute } from '@/lib/router';
import { useAuth } from '@/lib/auth-context';

export function Header() {
  const route = useRoute();
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShikimoriAnime[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reqId = useRef(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchQuery.trim();
    const id = ++reqId.current; // отсекаем устаревшие ответы
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const results = await fetchAnimes({ search: q, limit: 8 });
        if (id === reqId.current) setSearchResults(results);
      } catch {
        if (id === reqId.current) setSearchResults([]);
      } finally {
        if (id === reqId.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const closeSearch = () => {
    setShowResults(false);
    setMobileOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const openAnime = (id: number) => {
    navigate({ name: 'anime', id });
    closeSearch();
  };

  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'Enter' && searchResults[0]) openAnime(searchResults[0].id);
  };

  const resultsList = (
    <>
      {searchQuery.trim().length < 2 ? (
        <div className="p-4 text-center text-sm text-zinc-500">Введите минимум 2 символа</div>
      ) : searching ? (
        <div className="p-4 text-center text-sm text-zinc-500">Поиск...</div>
      ) : searchResults.length === 0 ? (
        <div className="p-4 text-center text-sm text-zinc-500">Ничего не найдено</div>
      ) : (
        searchResults.map((anime) => {
          const title = anime.russian || anime.name;
          return (
            <button
              key={anime.id}
              onClick={() => openAnime(anime.id)}
              className="flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-zinc-800/60"
            >
              <img
                src={imageUrl(anime.image.preview)}
                alt={title}
                className="h-16 w-11 shrink-0 rounded object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">{title}</p>
                <p className="truncate text-xs text-zinc-500">{anime.name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                  {anime.score && anime.score !== '0.0' && <span className="text-yellow-500">★ {anime.score}</span>}
                  {anime.kind && <span>{anime.kind.toUpperCase()}</span>}
                  {anime.aired_on && <span>{anime.aired_on.slice(0, 4)}</span>}
                </div>
              </div>
            </button>
          );
        })
      )}
    </>
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItem = (label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-lg ${
        isActive ? 'text-rose-400' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
        {/* Logo */}
        <button
          onClick={() => navigate({ name: 'home' })}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-red-600">
            <PlayIcon />
          </div>
          <span className="hidden text-lg font-bold text-white sm:inline">
            Ani<span className="text-rose-500">Stream</span>
          </span>
        </button>

        {/* Search: десктоп */}
        <div ref={searchRef} className="relative mx-2 hidden max-w-xl flex-1 sm:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              onKeyDown={onSearchKey}
              placeholder="Поиск аниме..."
              className="w-full rounded-lg bg-zinc-800/60 py-2 pl-9 pr-8 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-zinc-700/50 transition-all focus:ring-2 focus:ring-rose-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {showResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
              {resultsList}
            </div>
          )}
        </div>

        {/* Search: мобильная кнопка */}
        <div className="flex-1 sm:hidden" />
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Поиск"
          className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800/50 hover:text-zinc-100 sm:hidden"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Nav */}
        <nav className="flex items-center gap-1 shrink-0">
          {navItem('Главная', <HomeIcon className="h-4 w-4" />, route.name === 'home', () => navigate({ name: 'home' }))}
          {navItem('Каталог', <LayoutGrid className="h-4 w-4" />, route.name === 'catalog', () => navigate({ name: 'catalog' }))}

          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 ring-1 ring-zinc-700/50 transition hover:bg-zinc-800/50"
              >
                <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-zinc-400" />
                  )}
                </div>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl shadow-black/50">
                  <div className="px-3 py-2 border-b border-zinc-800 mb-1">
                    <p className="truncate text-sm font-medium text-zinc-200">{profile?.username || 'Пользователь'}</p>
                    <p className="truncate text-xs text-zinc-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { navigate({ name: 'profile' }); setUserMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
                  >
                    <UserIcon className="h-4 w-4" /> Профиль
                  </button>
                  <button
                    onClick={() => { signOut(); setUserMenuOpen(false); navigate({ name: 'home' }); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-zinc-800"
                  >
                    <LogOut className="h-4 w-4" /> Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate({ name: 'login' })}
                className="px-3 py-2 text-sm font-medium text-zinc-400 transition hover:text-zinc-100"
              >
                Войти
              </button>
              <button
                onClick={() => navigate({ name: 'signup' })}
                className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-rose-600"
              >
                Регистрация
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Search: мобильный полноэкранный режим */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-zinc-950 sm:hidden">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                autoFocus
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Поиск аниме..."
                className="w-full rounded-lg bg-zinc-800/60 py-3 pl-9 pr-8 text-base text-zinc-100 placeholder-zinc-500 outline-none ring-1 ring-zinc-700/50 focus:ring-2 focus:ring-rose-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={closeSearch} className="px-2 py-2 text-sm font-medium text-rose-400">
              Отмена
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">{resultsList}</div>
        </div>
      )}
    </header>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
