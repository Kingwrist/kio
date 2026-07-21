'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Maximize2, Minimize2, RefreshCw, Volume2, VolumeX, X } from 'lucide-react';

export type CameraFeed = {
  id: 'GKR_01' | 'GKR_02' | 'GKR_03' | 'GKR_04';
  name: string;
  description: string;
};

type Props = {
  camera: CameraFeed;
  onClose: () => void;
};

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export default function HlsCamera({ camera, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const hasPlayedRef = useRef(false);
  const [state, setState] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const streamUrl = `/api/camera-proxy?camera=${camera.id}`;

  useEffect(() => {
    let cancelled = false;
    if (!videoRef.current) return;
    const media = videoRef.current;

    hasPlayedRef.current = false;
    setState('loading');
    media.muted = muted;

    async function start() {
      try {
        if (media.canPlayType('application/vnd.apple.mpegurl')) {
          media.src = streamUrl;
          await media.play().catch(() => undefined);
          return;
        }

        const { default: Hls } = await import('hls.js');
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setState('error');
          return;
        }

        const hls = new Hls({
          lowLatencyMode: true,
          backBufferLength: 12,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 8,
          enableWorker: true,
        });
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(media);
        hls.on(Hls.Events.MANIFEST_PARSED, () => media.play().catch(() => undefined));
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else {
            setState('error');
            hls.destroy();
          }
        });
      } catch {
        if (!cancelled) setState('error');
      }
    }

    const onPlaying = () => {
      hasPlayedRef.current = true;
      setState('playing');
    };
    // Een HLS-livebeeld meldt geregeld kort "waiting" of "stalled" terwijl het
    // laatste frame zichtbaar blijft. Na de eerste succesvolle start tonen we
    // daarom geen blokkerende laad-overlay meer.
    const onWaiting = () => {
      if (!hasPlayedRef.current) setState('loading');
    };
    const onError = () => setState('error');
    media.addEventListener('playing', onPlaying);
    media.addEventListener('waiting', onWaiting);
    media.addEventListener('stalled', onWaiting);
    media.addEventListener('error', onError);
    void start();

    return () => {
      cancelled = true;
      media.removeEventListener('playing', onPlaying);
      media.removeEventListener('waiting', onWaiting);
      media.removeEventListener('stalled', onWaiting);
      media.removeEventListener('error', onError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      media.pause();
      media.removeAttribute('src');
      media.load();
    };
  }, [camera.id, reloadKey, streamUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!expanded) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    document.body.classList.add('cameraExpandedOpen');
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('cameraExpandedOpen');
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [expanded]);

  async function fullscreen() {
    const viewer = viewerRef.current;
    const video = videoRef.current as FullscreenVideo | null;
    try {
      if (viewer?.requestFullscreen) {
        await viewer.requestFullscreen();
        return;
      }
      if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
        return;
      }
    } catch {
      // Gebruik hieronder de betrouwbare CSS-uitvergroting als native fullscreen
      // door de browser wordt geweigerd.
    }
    setExpanded(true);
  }

  return (
    <div className={`cameraViewer${expanded ? ' expanded' : ''}`} ref={viewerRef}>
      <div className="cameraViewerHead">
        <div><b>{camera.name}</b><small>{camera.description}</small></div>
        <button onClick={expanded ? () => setExpanded(false) : onClose} aria-label={expanded ? 'Verkleinen' : 'Camera sluiten'}><X /></button>
      </div>
      <div className="liveCamera">
        <video ref={videoRef} className="liveCameraVideo" playsInline autoPlay muted={muted} controls={false} aria-label={`Live verkeerscamera ${camera.name}`} />
        <div className="cameraTopline">
          <span className={`livePill ${state}`}><i /> {state === 'playing' ? 'LIVE' : state === 'loading' ? 'VERBINDEN' : 'NIET BESCHIKBAAR'}</span>
          <span>{camera.id.replace('_', ' ')}</span>
        </div>
        {state === 'loading' && !hasPlayedRef.current && <div className="cameraOverlay"><RefreshCw className="spin" /><b>Livebeeld laden…</b></div>}
        {state === 'error' && <div className="cameraOverlay error"><Camera /><b>Camera tijdelijk niet bereikbaar</b><p>De stream reageert nu niet. Probeer opnieuw.</p><button onClick={() => setReloadKey(k => k + 1)}><RefreshCw /> Opnieuw proberen</button></div>}
        <div className="cameraControls">
          <button onClick={() => setMuted(v => !v)} aria-label={muted ? 'Geluid aan' : 'Geluid uit'}>{muted ? <VolumeX /> : <Volume2 />}</button>
          <button onClick={expanded ? () => setExpanded(false) : fullscreen} aria-label={expanded ? 'Verkleinen' : 'Volledig scherm'}>{expanded ? <Minimize2 /> : <Maximize2 />}</button>
        </div>
      </div>
      <p className="cameraDataNote">De stream start pas nadat je een camera opent. Sluiten stopt het videodataverbruik direct.</p>
    </div>
  );
}
