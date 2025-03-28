import { useEffect, useRef, useState } from 'react';
import './AudioWaveform.css';

interface AudioWaveformProps {
  audioFile: File;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isSynchronized: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioFile,
  currentTime,
  duration,
  isPlaying,
  isSynchronized
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    const analyzeAudio = async () => {
      setIsAnalyzing(true);
      const audioContext = new AudioContext();
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Get the raw audio data
      const channelData = audioBuffer.getChannelData(0);
      
      // Reduce the number of samples for visualization
      const samples = 200;
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];
      
      for (let i = 0; i < samples; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let sum = 0;
        
        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }
        
        waveform.push(sum / blockSize);
      }
      
      setWaveformData(waveform);
      setIsAnalyzing(false);
    };

    analyzeAudio();
  }, [audioFile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0 || isAnalyzing) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const progress = currentTime / duration;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform
    waveformData.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * height;
      const y = (height - barHeight) / 2;

      // Determine color based on playback position and sync state
      const isPlayed = x / width < progress;
      const color = isSynchronized
        ? isPlayed ? '#1db954' : '#2a2a2a'
        : isPlayed ? '#ff4444' : '#2a2a2a';

      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [waveformData, currentTime, duration, isSynchronized, isAnalyzing]);

  return (
    <div className="waveform-container">
      {isAnalyzing ? (
        <div className="waveform-loading">
          <div className="loading-spinner"></div>
          <span>Analyzing audio...</span>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={800}
          height={100}
          className="waveform-canvas"
        />
      )}
    </div>
  );
};

export default AudioWaveform; 