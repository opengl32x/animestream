import { useEffect, useRef, useState } from 'react';
import { Search, X, TrendingUp, LayoutGrid, User as UserIcon, LogOut, Home as HomeIcon } from 'lucide-react';
import type { ShikimoriAnime } from '@/types';
import { fetchAnimes, imageUrl, ratingBadge } from '@/lib/api';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchAnimes({ search: searchQuery, limit: 8 });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

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

        {/* Search */}
        <div ref={searchRef} className="relative flex-1 max-w-xl mx-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
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

          {/* Search dropdown */}
          {showResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50">
              {searching ? (
                <div className="p-4 text-center text-sm text-zinc-500">Поиск...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-sm text-zinc-500">Ничего не найдено</div>
              ) : (
                searchResults.map((anime) => {
                  const badge = ratingBadge(anime.rating);
                  const title = anime.russian || anime.name;
                  return (
                    <button
                      key={anime.id}
                      onClick={() => {
                        navigate({ name: 'anime', id: anime.id });
                        setShowResults(false);
                        setSearchQuery('');
                      }}
                      className="flex w-full items-center gap-3 p-2 text-left transition-colors hover:bg-zinc-800/60"
                    >
                      <img
                        src={imageUrl(anime.image.preview)}
                        alt={title}
                        className="h-14 w-10 shrink-0 rounded object-cover"
                        loading="lazy"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-200">{title}</p>
                        <p className="truncate text-xs text-zinc-500">{anime.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {anime.score && anime.score !== '0.0' && (
                            <span className="text-xs text-yellow-500">★ {anime.score}</span>
                          )}
                          {anime.kind && (
                            <span className="text-xs text-zinc-600">{anime.kind.toUpperCase()}</span>
                          )}
                          {badge && badge.label && (
                            <span className="text-xs text-zinc-600">{badge.label}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

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
