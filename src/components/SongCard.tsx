import { useState, useEffect } from 'react';
import { Lock, Play, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();

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

  const handleClick = () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    if (isUnlocked) {
    } else {
      setShowUnlock(true);
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
        onClick={handleClick}
        className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition cursor-pointer group"
      >
        <div className="relative aspect-square">
          {song.cover_thumbnail_url ? (
            <img
              src={song.cover_thumbnail_url}
              alt={song.title}
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
              <Play className="w-16 h-16 text-white" />
            </div>
          )}

          <div className="absolute top-2 right-2 bg-black bg-opacity-75 px-2 py-1 rounded flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-orange-500" />
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
