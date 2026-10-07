import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string | null;
}

export function VideoPlayer({ src }: VideoPlayerProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

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
        key={src}
        src={src}
        title="Плеер"
        className="h-full w-full border-0"
        allow="autoplay *; fullscreen *"
        allowFullScreen
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
