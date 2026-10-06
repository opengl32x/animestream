import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Loader2, Settings } from 'lucide-react';
import type { AnivoxStreamResponse } from '@/lib/api';

interface VideoPlayerProps {
  stream: AnivoxStreamResponse | null;
  poster?: string;
}

export function VideoPlayer({ stream, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState('');
  const [showQuality, setShowQuality] = useState(false);

  useEffect(() => {
    if (!stream?.links || !videoRef.current) return;
    const video = videoRef.current;
    const qualities = Object.keys(stream.links).sort((a, b) => Number(b) - Number(a));
    const initial = qualities[0];
    setQuality(initial);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const src = stream.links[initial];
    setLoading(true);
    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_e, d) => {
        if (d.fatal) {
          setError('Ошибка загрузки потока.');
          setLoading(false);
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        video.play().catch(() => {});
      });
    } else {
      setError('Браузер не поддерживает HLS.');
      setLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [stream]);

  const changeQuality = (q: string) => {
    if (!stream?.links[q] || !videoRef.current) return;
    setQuality(q);
    setShowQuality(false);
    const video = videoRef.current;
    const t = video.currentTime;
    const wasPlaying = !video.paused;
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const src = stream.links[q];
    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.currentTime = t;
        if (wasPlaying) video.play().catch(() => {});
      });
    } else {
      video.src = src;
      video.currentTime = t;
      if (wasPlaying) video.play().catch(() => {});
    }
  };

  if (!stream) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black ring-1 ring-zinc-800">
        <p className="text-sm text-zinc-500">Видео недоступно</p>
      </div>
    );
  }

  const qualities = Object.keys(stream.links).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-zinc-800">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900/80 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      <video ref={videoRef} poster={poster} controls playsInline className="h-full w-full" />
      {qualities.length > 1 && (
        <div className="absolute right-3 top-3 z-20">
          <button
            onClick={() => setShowQuality(!showQuality)}
            className="flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/90"
          >
            <Settings className="h-3.5 w-3.5" /> {quality}p
          </button>
          {showQuality && (
            <div className="absolute right-0 top-full mt-1 w-24 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
              {qualities.map((q) => (
                <button
                  key={q}
                  onClick={() => changeQuality(q)}
                  className={`w-full rounded px-2 py-1.5 text-left text-xs hover:bg-zinc-800 ${
                    q === quality ? 'text-rose-400' : 'text-zinc-300'
                  }`}
                >
                  {q}p
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
