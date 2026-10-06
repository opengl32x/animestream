import { useEffect, useState, useCallback } from 'react';
import { User as UserIcon, Bookmark, Trash2, Loader2 } from 'lucide-react';
import type { Bookmark as BookmarkType, BookmarkStatus, ShikimoriAnime } from '@/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { fetchAnimeById, imageUrl } from '@/lib/api';
import { navigate } from '@/lib/router';

const STATUS_LABELS: Record<BookmarkStatus, { label: string; color: string }> = {
  watching: { label: 'Смотрю', color: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' },
  planned: { label: 'В планах', color: 'text-sky-400 bg-sky-500/10 ring-sky-500/20' },
  completed: { label: 'Просмотрено', color: 'text-violet-400 bg-violet-500/10 ring-violet-500/20' },
  dropped: { label: 'Брошено', color: 'text-red-400 bg-red-500/10 ring-red-500/20' },
};

const STATUS_TABS: BookmarkStatus[] = ['watching', 'planned', 'completed', 'dropped'];

export function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [animeCache, setAnimeCache] = useState<Record<number, ShikimoriAnime>>({});
  const [activeTab, setActiveTab] = useState<BookmarkStatus>('watching');
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    if (!user) return;
    setLoadingBookmarks(true);
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const list = (data ?? []) as BookmarkType[];
    setBookmarks(list);

    // Fetch anime metadata for each bookmark
    const cache: Record<number, ShikimoriAnime> = {};
    await Promise.all(
      list.map(async (b) => {
        try {
          const anime = await fetchAnimeById(b.shikimori_id);
          cache[b.shikimori_id] = anime;
        } catch { /* ignore */ }
      })
    );
    setAnimeCache(cache);
    setLoadingBookmarks(false);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ name: 'login' });
      return;
    }
    loadBookmarks();
  }, [user, loading, loadBookmarks]);

  const handleRemove = async (id: string, shikimoriId: number) => {
    setDeletingId(id);
    try {
      await supabase.from('bookmarks').delete().eq('id', id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  const filteredBookmarks = bookmarks.filter(b => b.status === activeTab);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Profile header */}
      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 ring-1 ring-zinc-700">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-10 w-10 text-zinc-500" />
          )}
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-white">{profile?.username || 'Пользователь'}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Всего в списках: {bookmarks.length}
          </p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => {
          const count = bookmarks.filter(b => b.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-800/60 text-zinc-300 ring-1 ring-zinc-700/50 hover:bg-zinc-700/60'
              }`}
            >
              {STATUS_LABELS[tab].label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 text-xs ${activeTab === tab ? 'bg-white/20' : 'bg-zinc-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bookmarks grid */}
      {loadingBookmarks ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="py-20 text-center">
          <Bookmark className="mx-auto mb-3 h-12 w-12 text-zinc-700" />
          <p className="text-zinc-500">Список пуст</p>
          <button
            onClick={() => navigate({ name: 'catalog' })}
            className="mt-3 text-sm text-rose-400 hover:text-rose-300"
          >
            Перейти в каталог
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {filteredBookmarks.map(b => {
            const anime = animeCache[b.shikimori_id];
            const title = anime?.russian || anime?.name || `#${b.shikimori_id}`;
            return (
              <div
                key={b.id}
                className="group relative overflow-hidden rounded-xl bg-zinc-900/80 ring-1 ring-zinc-800"
              >
                <div
                  onClick={() => navigate({ name: 'anime', id: b.shikimori_id })}
                  className="cursor-pointer"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    {anime ? (
                      <img
                        src={imageUrl(anime.image.original)}
                        alt={title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full w-full bg-zinc-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-sm font-medium text-zinc-100" title={title}>{title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(b.id, b.shikimori_id)}
                  disabled={deletingId === b.id}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 p-1.5 text-zinc-400 opacity-0 backdrop-blur-sm transition hover:text-red-400 group-hover:opacity-100"
                >
                  {deletingId === b.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
