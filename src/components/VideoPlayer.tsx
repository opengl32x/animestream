import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string | null;
  /** Меняется при смене серии или аниме */
  episodeKey: string;
}

export function VideoPlayer({ src, episodeKey }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [qualities, setQualities] = useState<{ index: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);

  // При смене серии/тайтла сбрасываем плеер в начало
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [episodeKey]);

  // Основная логика HLS и мгновенной подмены озвучки
  useEffect(() => {
    if (!src || !videoRef.current) return;

    const video = videoRef.current;

    // Проверяем, прямая ли это HLS (.m3u8) ссылка
    if (src.includes('.m3u8') || Hls.isSupported()) {
      setLoaded(false);

      if (!hlsRef.current) {
        const hls = new Hls({
          enableWorker: true,
          maxBufferLength: 20,
          backBufferLength: 10,
        });

        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setLoaded(true);
          const levels = data.levels.map((lvl, index) => ({
            index,
            height: lvl.height,
          }));
          setQualities(levels);
        });
      }

      const hls = hlsRef.current;
      const currentTime = video.currentTime; // Запоминаем текущую секунду
      const isPlaying = !video.paused;

      // Мгновенно подменяем источник без пересоздания DOM-элемента
      hls.loadSource(src);

      const onManifestParsed = () => {
        if (currentTime > 0) {
          video.currentTime = currentTime; // Возвращаем воспроизведение на то же место
        }
        if (isPlaying) {
          video.play().catch(() => {});
        }
        hls.off(Hls.Events.MANIFEST_PARSED, onManifestParsed);
      };

      hls.on(Hls.Events.MANIFEST_PARSED, onManifestParsed);
    }

    return () => {
      // Экземпляр HLS сохраняется между сменой озвучек
    };
  }, [src]);

  // Ручное переключение разрешения (1080p, 720p и т.д.)
  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex; // -1 = Auto
      setCurrentQuality(levelIndex);
    }
  };

  if (!src) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black ring-1 ring-zinc-800">
        <p className="text-sm text-zinc-500">Видео недоступно</p>
      </div>
    );
  }

  // Запасной вариант: если ссылка всё ещё от iframe (фоллбэк)
  if (!src.includes('.m3u8')) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-800">
        <iframe
          src={src}
          title="Плеер"
          className="h-full w-full border-0"
          allow="autoplay *; fullscreen *"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-800 group">
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      )}

      {/* HTML5 Видео-тег (без перезагрузок DOM при смене озвучек) */}
      <video
        ref={videoRef}
        controls
        className="h-full w-full object-contain"
        playsInline
      />

      {/* Выбор качества в правом верхнем углу */}
      {qualities.length > 0 && (
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <select
            value={currentQuality}
            onChange={(e) => handleQualityChange(Number(e.target.value))}
            className="bg-black/80 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl border border-zinc-700 outline-none cursor-pointer shadow-lg"
          >
            <option value={-1}>Качество: Авто</option>
            {qualities.map((q) => (
              <option key={q.index} value={q.index}>
                {q.height}p
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
