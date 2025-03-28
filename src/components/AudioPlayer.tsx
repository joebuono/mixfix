import { useState, useRef, useEffect } from 'react';
import AudioWaveform from './AudioWaveform';
import './AudioPlayer.css';

interface AudioPlayerProps {
  audioFile: File;
  audioRef: (element: HTMLAudioElement | null) => void;
  isPlaying: boolean;
  onPlaybackStateChange: (playing: boolean) => void;
  isSynchronized: boolean;
  masterTime: number;
  onDurationChange: (duration: number) => void;
  trackName: string;
  onRemove: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  audioFile, 
  audioRef,
  isPlaying,
  onPlaybackStateChange,
  isSynchronized,
  masterTime,
  onDurationChange,
  trackName,
  onRemove
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const audio = localAudioRef.current;
    if (!audio) return;

    let url: string | null = null;
    let isActive = true;

    const setupAudio = async () => {
      try {
        url = URL.createObjectURL(audioFile);
        audio.src = url;
        
        const handleLoadedMetadata = () => {
          if (!isActive || !isMountedRef.current) return;
          setDuration(audio.duration);
          onDurationChange(audio.duration);
          setIsLoaded(true);
        };

        const handleTimeUpdate = () => {
          if (!isActive || !isMountedRef.current) return;
          setCurrentTime(audio.currentTime);
        };

        const handleError = (e: Event) => {
          if (!isActive || !isMountedRef.current) return;
          console.error('Error loading audio:', e);
          setIsLoaded(false);
        };

        const handleCanPlay = () => {
          if (!isActive || !isMountedRef.current) return;
          setIsLoaded(true);
        };

        const handleEnded = () => {
          if (!isActive || !isMountedRef.current) return;
          onPlaybackStateChange(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('ended', handleEnded);

        return () => {
          isActive = false;
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('error', handleError);
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('ended', handleEnded);
        };
      } catch (error) {
        console.error('Error setting up audio:', error);
        return () => {};
      }
    };

    const cleanup = setupAudio();

    return () => {
      cleanup.then(cleanupFn => cleanupFn());
      if (url) {
        URL.revokeObjectURL(url);
      }
      if (audio) {
        audio.src = '';
        audio.load();
      }
    };
  }, [audioFile, onDurationChange, onPlaybackStateChange]);

  useEffect(() => {
    const audio = localAudioRef.current;
    if (!audio || !isLoaded || !isMountedRef.current) return;

    let playPromise: Promise<void> | undefined;

    const playAudio = async () => {
      try {
        if (isPlaying) {
          audio.currentTime = masterTime;
          playPromise = audio.play();
          await playPromise;
        } else {
          audio.pause();
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Ignore AbortError as it's expected when loading new audio
          return;
        }
        console.error('Error playing audio:', error);
        onPlaybackStateChange(false);
      }
    };

    playAudio();
  }, [isPlaying, masterTime, isLoaded, onPlaybackStateChange]);

  useEffect(() => {
    const audio = localAudioRef.current;
    if (!audio || !isSynchronized || !isLoaded || !isMountedRef.current) return;
    
    audio.currentTime = masterTime;
  }, [masterTime, isSynchronized, isLoaded]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    adjustVolume(newVolume - volume);
    e.target.style.setProperty('--volume', newVolume.toString());
  };

  const adjustVolume = (delta: number) => {
    if (localAudioRef.current) {
      const newVolume = Math.max(0, Math.min(1, volume + delta));
      localAudioRef.current.volume = newVolume;
      setVolume(newVolume);
      if (localAudioRef.current) {
        localAudioRef.current.style.setProperty('--volume', newVolume.toString());
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`audio-player ${isSynchronized ? 'synchronized' : 'unsynchronized'}`}>
      <audio 
        ref={(el) => {
          localAudioRef.current = el;
          audioRef(el);
          if (el) {
            el.style.setProperty('--volume', volume.toString());
          }
        }} 
      />
      <div className="player-content">
        <div className="track-info">
          <h3 className="track-name">{trackName}</h3>
          <button 
            className="remove-track" 
            onClick={onRemove}
            title="Remove track"
          >
            ×
          </button>
        </div>
        <div className="player-controls">
          <AudioWaveform
            audioFile={audioFile}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            isSynchronized={isSynchronized}
          />
          <div className="volume-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              style={{ '--volume': volume } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer; 