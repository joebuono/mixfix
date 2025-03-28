import { useState, useRef, useEffect } from 'react'
import AudioUploader from './components/AudioUploader'
import AudioPlayer from './components/AudioPlayer'
import './App.css'

interface AudioTrack {
  id: string;
  file: File;
  name: string;
  isSynchronized: boolean;
}

function App() {
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(1);
  const [masterTime, setMasterTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  const handleFileSelect = (files: File[]) => {
    const newTracks: AudioTrack[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      isSynchronized: true
    }));
    setAudioTracks(prev => [...prev, ...newTracks]);
  };

  const removeTrack = (id: string) => {
    const audio = audioRefs.current[id];
    if (audio) {
      audio.src = '';
      audio.load();
      delete audioRefs.current[id];
    }
    setAudioTracks(prev => prev.filter(track => track.id !== id));
  };

  const handleMasterPlay = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.currentTime = masterTime;
        audio.play();
      }
    });
    setIsPlaying(true);
  };

  const handleMasterStop = () => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = masterTime;
      }
    });
    setIsPlaying(false);
  };

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setMasterVolume(newVolume);
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.volume = newVolume;
      }
    });
  };

  const handleMasterTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setMasterTime(newTime);
  };

  const updateMaxDuration = (duration: number) => {
    setMaxDuration(prev => Math.max(prev, duration));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleTrackSync = (id: string) => {
    setAudioTracks(prev => prev.map(track => 
      track.id === id ? { ...track, isSynchronized: !track.isSynchronized } : track
    ));
  };

  return (
    <div className="app">
      <h1>Mix Fix App</h1>
      <div className="master-controls">
        <div className="master-buttons">
          <button 
            className="master-play" 
            onClick={handleMasterPlay}
            disabled={audioTracks.length === 0}
            title="Play All"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <button 
            className="master-stop" 
            onClick={handleMasterStop}
            disabled={audioTracks.length === 0}
            title="Stop All"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z"/>
            </svg>
          </button>
        </div>
        <div className="master-time-container">
          <div className="master-time">
            <span className="current-time">{formatTime(masterTime)}</span>
            <input
              type="range"
              min="0"
              max={maxDuration}
              step="0.1"
              value={masterTime}
              onChange={handleMasterTimeChange}
              className="master-time-slider"
            />
            <span className="duration">{formatTime(maxDuration)}</span>
          </div>
          <div className="master-volume">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={handleMasterVolumeChange}
              className="master-volume-slider"
              style={{ '--volume': masterVolume } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      <div className="tracks-container">
        {audioTracks.map((track, index) => (
          <div key={track.id} className="track-item">
            <AudioPlayer
              audioFile={track.file}
              audioRef={(el) => {
                if (el) {
                  audioRefs.current[track.id] = el;
                }
              }}
              isPlaying={isPlaying}
              onPlaybackStateChange={(playing) => setIsPlaying(playing)}
              isSynchronized={track.isSynchronized}
              masterTime={masterTime}
              onDurationChange={updateMaxDuration}
              trackName={track.name}
              onRemove={() => removeTrack(track.id)}
            />
          </div>
        ))}
      </div>

      <AudioUploader onFileSelect={handleFileSelect} />
    </div>
  )
}

export default App
