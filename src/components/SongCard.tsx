import { useState, useEffect } from 'react';
import { Lock, Play, Pause, Loader2, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from './Toast';
import { UnlockModal } from './UnlockModal';
import type { Database } from '../lib/database.types';

type Song = Database['public']['Tables']['songs']['Row'];

interface SongCardProps {
  song: Song;
}

export function SongCard({ song }: SongCardProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, spendCredits, profile } = useAuth();
  const { currentTrackId, isPlaying, play, pause, isLoading } = usePlayer();
  const { showToast } = useToast();

  const isCurrentTrack = currentTrackId === song.id;
  const isThisTrackPlaying = isCurrentTrack && isPlaying;

  useEffect(() => {
    if (user) {
      checkUnlocked();
    }
    fetchArtistName();
  }, [user, song.id]);

  const checkUnlocked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('unlocked_songs')
      .select('*')
      .eq('user_id', user.id)
      .eq('song_id', song.id)
      .eq('refunded', false)
      .maybeSingle();

    setIsUnlocked(!!data);
  };

  const fetchArtistName = async () => {
    const { data } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', song.artist_id)
      .maybeSingle();

    if (data) {
      setArtistName(data.display_name || data.email.split('@')[0]);
    }
  };

  const handlePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!isUnlocked) {
      setShowUnlock(true);
      return;
    }

    if (isProcessing || isLoading) {
      return;
    }

    if (isThisTrackPlaying) {
      pause();
      return;
    }

    if (!song.audio_url) {
      showToast('Audio file not available', 'error');
      return;
    }

    try {
      setIsProcessing(true);
      play(song.id, song.audio_url);
      showToast(`Playing ${song.title}`, 'success');
    } catch (err) {
      console.error('convivo:error: Playback failed', err);
      showToast('Failed to play song', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (!isUnlocked) {
      setShowUnlock(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlayPause(e as any);
    }
  };

  const formatHH = (score: number) => {
    if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toString();
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition cursor-pointer group"
        role="button"
        tabIndex={0}
        onKeyPress={handleKeyPress}
        aria-label={`${song.title} by ${artistName}. ${isUnlocked ? 'Unlocked' : `${song.price_credits} credits to unlock`}`}
      >
        <div className="relative aspect-square">
          {song.cover_thumbnail_url ? (
            <img
              src={song.cover_thumbnail_url}
              alt={`${song.title} by ${artistName} cover art`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-600" />
            </div>
          )}

          {!isUnlocked && (
            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <div className="text-center">
                <Lock className="w-12 h-12 text-white mx-auto mb-2" />
                <p className="text-white font-medium">Unlock to Play</p>
              </div>
            </div>
          )}

          {isUnlocked && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={handlePlayPause}
                disabled={isProcessing || isLoading}
                className="bg-orange-500 hover:bg-orange-600 rounded-full p-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isThisTrackPlaying ? 'Pause' : 'Play'}
              >
                {isProcessing || (isLoading && isCurrentTrack) ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : isThisTrackPlaying ? (
                  <Pause className="w-8 h-8 text-white" />
                ) : (
                  <Play className="w-8 h-8 text-white" />
                )}
              </button>
            </div>
          )}

          <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded flex items-center space-x-1" aria-label={`Haven Heat score: ${formatHH(song.haven_heat_score)}`}>
            <TrendingUp className="w-3 h-3 text-orange-500" aria-hidden="true" />
            <span className="text-white text-xs font-medium">HH: {formatHH(song.haven_heat_score)}</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white font-medium truncate">{song.title}</h3>
          <p className="text-gray-400 text-sm truncate">{artistName}</p>
          {song.genre && (
            <span className="inline-block mt-2 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
              {song.genre}
            </span>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-orange-500 font-bold">{song.price_credits} credits</span>
            {isUnlocked && (
              <span className="text-green-500 text-xs font-medium">Owned</span>
            )}
          </div>
        </div>
      </div>

      {showUnlock && (
        <UnlockModal
          song={song}
          artistName={artistName}
          onClose={() => setShowUnlock(false)}
          onUnlocked={() => {
            setIsUnlocked(true);
            setShowUnlock(false);
          }}
        />
      )}
    </>
  );
}
