import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';

interface PlayerContextType {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (trackId: string, audioUrl: string) => void;
  pause: () => void;
  seek: (seconds: number) => void;
  isLoading: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const STORAGE_KEY_TRACK = 'convivo:currentTrack';
const STORAGE_KEY_TIME = 'convivo:currentTime';

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const persistIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
        setIsLoading(false);
      });

      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        persistToStorage();
      });

      audioRef.current.addEventListener('error', () => {
        console.error('convivo:error: Audio playback failed');
        setIsLoading(false);
        setIsPlaying(false);
      });
    }

    const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK);
    const savedTime = localStorage.getItem(STORAGE_KEY_TIME);

    if (savedTrack && savedTime) {
      setCurrentTrackId(savedTrack);
      setCurrentTime(parseFloat(savedTime));
    }

    return () => {
      if (persistIntervalRef.current) {
        clearInterval(persistIntervalRef.current);
      }
    };
  }, []);

  const persistToStorage = () => {
    if (currentTrackId && audioRef.current) {
      localStorage.setItem(STORAGE_KEY_TRACK, currentTrackId);
      localStorage.setItem(STORAGE_KEY_TIME, audioRef.current.currentTime.toString());
    }
  };

  const play = (trackId: string, audioUrl: string) => {
    if (!audioRef.current) return;

    setIsLoading(true);

    if (currentTrackId === trackId) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          startPersistInterval();
        })
        .catch((err) => {
          console.error('convivo:error: Play failed', err);
          setIsLoading(false);
        });
    } else {
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      setCurrentTrackId(trackId);

      const savedTime = localStorage.getItem(STORAGE_KEY_TIME);
      const savedTrack = localStorage.getItem(STORAGE_KEY_TRACK);

      if (savedTrack === trackId && savedTime) {
        audioRef.current.currentTime = parseFloat(savedTime);
      }

      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          startPersistInterval();
        })
        .catch((err) => {
          console.error('convivo:error: Play failed', err);
          setIsLoading(false);
        });
    }
  };

  const pause = () => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setIsPlaying(false);
    persistToStorage();
    stopPersistInterval();
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = seconds;
    setCurrentTime(seconds);
    persistToStorage();
  };

  const startPersistInterval = () => {
    if (persistIntervalRef.current) {
      clearInterval(persistIntervalRef.current);
    }

    persistIntervalRef.current = window.setInterval(() => {
      persistToStorage();
    }, 5000);
  };

  const stopPersistInterval = () => {
    if (persistIntervalRef.current) {
      clearInterval(persistIntervalRef.current);
      persistIntervalRef.current = null;
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrackId,
        isPlaying,
        currentTime,
        duration,
        play,
        pause,
        seek,
        isLoading,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
