'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Maximize2, RefreshCw, Volume2, VolumeX, X } from 'lucide-react';

export type CameraFeed = {
  id: 'GKR_01' | 'GKR_02' | 'GKR_03' | 'GKR_04';
  name: string;
  description: string;
};

type Props = {
  camera: CameraFeed;
  onClose: () => void;
};

export default function HlsCamera({ camera, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [state, setState] = useState<'loading' | 'playing' | 'error'>('loading');
  const [muted, setMuted] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const streamUrl = `/api/camera-proxy?camera=${camera.id}`;

  useEffect(() => {
    let cancelled = false;
    if (!videoRef.current) return;
    const media = videoRef.current as HTMLVideoElement;

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

    const onPlaying = () => setState('playing');
    const onWaiting = () => setState('loading');
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

  async function fullscreen() {
    if (videoRef.current?.requestFullscreen) await videoRef.current.requestFullscreen();
  }

  return (
    <div className="cameraViewer">
      <div className="cameraViewerHead">
        <div><b>{camera.name}</b><small>{camera.description}</small></div>
        <button onClick={onClose} aria-label="Camera sluiten"><X /></button>
      </div>
      <div className="liveCamera">
        <video ref={videoRef} className="liveCameraVideo" playsInline autoPlay muted={muted} controls={false} aria-label={`Live verkeerscamera ${camera.name}`} />
        <div className="cameraTopline">
          <span className={`livePill ${state}`}><i /> {state === 'playing' ? 'LIVE' : state === 'loading' ? 'VERBINDEN' : 'NIET BESCHIKBAAR'}</span>
          <span>{camera.id.replace('_', ' ')}</span>
        </div>
        {state === 'loading' && <div className="cameraOverlay"><RefreshCw className="spin" /><b>Livebeeld laden…</b></div>}
        {state === 'error' && <div className="cameraOverlay error"><Camera /><b>Camera tijdelijk niet bereikbaar</b><p>De stream reageert nu niet. Probeer opnieuw.</p><button onClick={() => setReloadKey(k => k + 1)}><RefreshCw /> Opnieuw proberen</button></div>}
        <div className="cameraControls">
          <button onClick={() => setMuted(v => !v)} aria-label={muted ? 'Geluid aan' : 'Geluid uit'}>{muted ? <VolumeX /> : <Volume2 />}</button>
          <button onClick={fullscreen} aria-label="Volledig scherm"><Maximize2 /></button>
        </div>
      </div>
      <p className="cameraDataNote">De stream start pas nadat je een camera opent. Sluiten stopt het videodataverbruik direct.</p>
    </div>
  );
}
