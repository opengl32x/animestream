import { useEffect, useState, useCallback } from 'react';
import { Star, Clock, Calendar, Film, Users, ChevronLeft, Play, Loader2, Send, Trash2, Bookmark as BookmarkIcon } from 'lucide-react';
import type { ShikimoriAnime, ShikimoriScreenshot, ShikimoriCharacter, BookmarkStatus, Comment, Profile } from '@/types';
import {
  fetchAnimeById,
  fetchScreenshots,
  fetchCharacters,
  imageUrl,
  ratingBadge,
  fetchAnivoxDubbers,
  fetchAnivoxStream,
  type AnivoxDubber,
  type AnivoxStreamResponse,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { navigate } from '@/lib/router';
import { ErrorState } from '@/components/Skeletons';
import { VideoPlayer } from '@/components/VideoPlayer';

const BOOKMARK_STATUSES: { value: BookmarkStatus; label: string; color: string }[] = [
  { value: 'watching', label: 'Смотрю', color: 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30' },
  { value: 'planned', label: 'В планах', color: 'bg-sky-500/20 text-sky-300 ring-sky-500/30' },
  { value: 'completed', label: 'Просмотрено', color: 'bg-violet-500/20 text-violet-300 ring-violet-500/30' },
  { value: 'dropped', label: 'Брошено', color: 'bg-red-500/20 text-red-300 ring-red-500/30' },
];

interface AnimeDetailPageProps {
  animeId: number;
}

export function AnimeDetailPage({ animeId }: AnimeDetailPageProps) {
  const { user, profile } = useAuth();
  const [anime, setAnime] = useState<ShikimoriAnime | null>(null);
  const [screenshots, setScreenshots] = useState<ShikimoriScreenshot[]>([]);
  const [characters, setCharacters] = useState<ShikimoriCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [showAllChars, setShowAllChars] = useState(false);

  // ===== ANIVOX PLAYER STATE =====
  const [dubbers, setDubbers] = useState<AnivoxDubber[]>([]);
  const [activeDubber, setActiveDubber] = useState<number | null>(null);
  const [episode, setEpisode] = useState(1);
  const [stream, setStream] = useState<AnivoxStreamResponse | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  // Bookmark state
  const [bookmark, setBookmark] = useState<BookmarkStatus | null>(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);

  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentProfiles, setCommentProfiles] = useState<Record<string, Profile>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [animeData, screenshotsData, charactersData] = await Promise.all([
        fetchAnimeById(animeId),
        fetchScreenshots(animeId).catch(() => []),
        fetchCharacters(animeId).catch(() => []),
      ]);
      setAnime(animeData);
      setScreenshots(screenshotsData);
      setCharacters(charactersData);
      if (screenshotsData.length > 0) setActiveScreenshot(imageUrl(screenshotsData[0].original));
    } catch {
      setError('Не удалось загрузить информацию об аниме.');
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  useEffect(() => { load(); }, [load]);

  // Загружаем список озвучек anivox
  useEffect(() => {
    if (!anime) return;
    fetchAnivoxDubbers(anime.id).then(list => {
      setDubbers(list);
      if (list.length > 0) setActiveDubber(list[0].id);
    });
  }, [anime]);

  // Загружаем поток при смене озвучки/эпизода
  useEffect(() => {
    if (!anime || activeDubber === null) return;
    setStreamLoading(true);
    setStreamError(null);
    setStream(null);
    fetchAnivoxStream(anime.id, episode, activeDubber).then(s => {
      if (!s) {
        setStreamError('Не удалось получить поток для этой озвучки.');
      } else {
        setStream(s);
      }
      setStreamLoading(false);
    });
  }, [anime, activeDubber, episode]);

  // Load bookmark
  useEffect(() => {
    if (!user) { setBookmark(null); return; }
    supabase
      .from('bookmarks')
      .select('status')
      .eq('shikimori_id', animeId)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setBookmark((data?.status as BookmarkStatus | null) ?? null);
      });
  }, [user, animeId]);

  const loadComments = useCallback(async () => {
    const { data, error: cError } = await supabase
      .from('comments')
      .select('*')
      .eq('shikimori_id', animeId)
      .order('created_at', { ascending: false });
    if (cError) return;
    const commentList = (data ?? []) as Comment[];
    setComments(commentList);

    const userIds = [...new Set(commentList.map(c => c.user_id))];
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      if (profilesData) {
        const map: Record<string, Profile> = {};
        for (const p of profilesData as Profile[]) {
          map[p.id] = p;
        }
        setCommentProfiles(map);
      }
    }
  }, [animeId]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleBookmark = async (status: BookmarkStatus) => {
    if (!user) {
      navigate({ name: 'login' });
      return;
    }
    setBookmarkLoading(true);
    setShowBookmarkMenu(false);
    try {
      if (bookmark === status) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('shikimori_id', animeId)
          .eq('user_id', user.id);
        setBookmark(null);
      } else if (bookmark) {
        await supabase
          .from('bookmarks')
          .update({ status })
          .eq('shikimori_id', animeId)
          .eq('user_id', user.id);
        setBookmark(status);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ shikimori_id: animeId, status });
        setBookmark(status);
      }
    } catch {
      // ignore
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate({ name: 'login' });
      return;
    }
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({ shikimori_id: animeId, text: commentText.trim() })
        .select('*')
        .single();
      if (insertError) throw insertError;
      const newComment = data as Comment;
      setComments(prev => [newComment, ...prev]);
      if (profile && !commentProfiles[profile.id]) {
        setCommentProfiles(prev => ({ ...prev, [profile.id]: profile }));
      }
      setCommentText('');
    } catch {
      setCommentError('Не удалось отправить комментарий.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await supabase.from('comments').delete().eq('id', commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch { /* ignore */ }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;

  if (loading || !anime) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-6">
          <div className="hidden w-64 shrink-0 sm:block">
            <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-zinc-800/70" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-zinc-800/70" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800/70" />
            <div className="aspect-video w-full animate-pulse rounded-xl bg-zinc-800/70" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800/70" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-800/70" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-800/70" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const badge = ratingBadge(anime.rating);
  const title = anime.russian || anime.name;
  const displayedCharacters = showAllChars ? characters : characters.slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <button
        onClick={() => navigate({ name: 'catalog' })}
        className="mb-4 flex items-center gap-1 text-sm text-zinc-400 transition hover:text-zinc-200"
      >
        <ChevronLeft className="h-4 w-4" /> Назад к каталогу
      </button>

      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="mx-auto w-full max-w-[200px] shrink-0 sm:mx-0 sm:w-56">
          <div className="overflow-hidden rounded-xl ring-1 ring-zinc-800">
            <img
              src={imageUrl(anime.image.original)}
              alt={title}
              className="w-full object-cover"
            />
          </div>
          {badge && badge.label && (
            <div className={`mt-2 flex items-center justify-center rounded-lg py-1.5 text-sm font-bold ${badge.color}`}>
              {badge.label}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{anime.name}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {anime.score && anime.score !== '0.0' && (
              <div className="flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1.5 ring-1 ring-yellow-500/20">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-yellow-400">{anime.score}</span>
              </div>
            )}
            {anime.kind && (
              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300">
                <Film className="h-4 w-4 text-zinc-500" />
                {anime.kind.toUpperCase()}
              </div>
            )}
            {anime.episodes > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300">
                <Play className="h-4 w-4 text-zinc-500" />
                {anime.episodes_aired || anime.episodes} / {anime.episodes} эп.
              </div>
            )}
            {anime.duration > 0 && (
              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300">
                <Clock className="h-4 w-4 text-zinc-500" />
                {anime.duration} мин.
              </div>
            )}
            {anime.aired_on && (
              <div className="flex items-center gap-1.5 rounded-lg bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-300">
                <Calendar className="h-4 w-4 text-zinc-500" />
                {anime.aired_on.slice(0, 4)}
              </div>
            )}
          </div>

          {anime.genres && anime.genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {anime.genres.map(g => (
                <span key={g.id} className="rounded-full bg-zinc-800/60 px-3 py-1 text-xs text-zinc-400 ring-1 ring-zinc-700/50">
                  {g.russian || g.name}
                </span>
              ))}
            </div>
          )}

          <div className="relative mt-5">
            <button
              onClick={() => setShowBookmarkMenu(!showBookmarkMenu)}
              disabled={bookmarkLoading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                bookmark
                  ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/30'
                  : 'bg-zinc-800/60 text-zinc-300 ring-1 ring-zinc-700/50 hover:bg-zinc-700/60'
              }`}
            >
              <BookmarkIcon className="h-4 w-4" fill={bookmark ? 'currentColor' : 'none'} />
              {bookmark ? BOOKMARK_STATUSES.find(s => s.value === bookmark)?.label : 'В список'}
            </button>
            {showBookmarkMenu && (
              <div className="absolute left-0 top-full z-30 mt-2 w-44 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl">
                {BOOKMARK_STATUSES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => handleBookmark(s.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-zinc-800 ${
                      bookmark
