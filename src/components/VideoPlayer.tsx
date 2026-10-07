import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string | null;
  /** Меняется при смене серии или аниме. Если сменилась только озвучка, остаётся прежним. */
  episodeKey: string;
}

// События плеера Kodik, после которых можно пробовать перемотать
const SEEK_EVENTS = new Set([
  'kodik_player_video_started',
  'kodik_player_play',
  'kodik_player_duration_update',
]);

function postSeek(iframe: HTMLIFrameElement | null, seconds: number) {
  iframe?.contentWindow?.postMessage(
    { key: 'kodik_player_api', value: { method: 'seek', seconds } },
    '*',
  );
}

export function VideoPlayer({ src, episodeKey }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const timeRef = useRef(0); // последняя известная секунда просмотра
  const resumeRef = useRef(0); // куда перемотать новый плеер (0 = не нужно)
  const attemptsRef = useRef(0);
  const seenKeys = useRef(new Set<string>());

  // Новая серия или аниме: начинаем с нуля.
  // Этот эффект должен идти раньше эффекта по src.
  useEffect(() => {
    timeRef.current = 0;
  }, [episodeKey]);

  // Новая ссылка: если сменилась только озвучка, запоминаем, откуда продолжить
  useEffect(() => {
    setLoaded(false);
    resumeRef.current = timeRef.current > 3 ? timeRef.current : 0;
    attemptsRef.current = 0;
    if (resumeRef.current === 0) return;
    // Если за 10 секунд перемотка не удалась, сдаёмся
    const t = window.setTimeout(() => {
      resumeRef.current = 0;
    }, 10000);
    return () => window.clearTimeout(t);
  }, [src]);

  // Слушаем сообщения от плеера Kodik
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data;
      if (!d || typeof d !== 'object' || typeof d.key !== 'string') return;

      // Для отладки: один раз выводим каждый тип сообщения в консоль
      if (!seenKeys.current.has(d.key)) {
        seenKeys.current.add(d.key);
        console.debug('[kodik]', d.key, d.value);
      }

      const pending = resumeRef.current;

      if (d.key === 'kodik_player_time_update' && typeof d.value === 'number') {
        if (pending > 0) {
          if (d.value >= pending - 2) {
            resumeRef.current = 0; // перемотка сработала
          } else if (attemptsRef.current < 8) {
            attemptsRef.current++;
            postSeek(iframeRef.current, pending);
          }
        } else {
          timeRef.current = d.value;
        }
        return;
      }

      if (pending > 0 && SEEK_EVENTS.has(d.key) && attemptsRef.current < 8) {
        attemptsRef.current++;
        postSeek(iframeRef.current, pending);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black ring-1 ring-zinc-800">
        <p className="text-sm text-zinc-500">Видео недоступно</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-800">
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      )}
      <iframe
        ref={iframeRef}
        key={src}
        src={src}
        title="Плеер"
        className="h-full w-full border-0"
        allow="autoplay *; fullscreen *"
        allowFullScreen
        onLoad={() => {
          setLoaded(true);
          if (resumeRef.current > 0) postSeek(iframeRef.current, resumeRef.current);
        }}
      />
    </div>
  );
}
