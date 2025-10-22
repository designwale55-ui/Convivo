import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Music } from 'lucide-react';
import { SongCard } from '../components/SongCard';
import type { Database } from '../lib/database.types';

type Song = Database['public']['Tables']['songs']['Row'];

export function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchUnlockedSongs();
  }, [user]);

  const fetchUnlockedSongs = async () => {
    if (!user) return;

    setLoading(true);

    const { data: unlockedData } = await supabase
      .from('unlocked_songs')
      .select('song_id')
      .eq('user_id', user.id)
      .eq('refunded', false);

    if (unlockedData && unlockedData.length > 0) {
      const songIds = unlockedData.map((u) => u.song_id);
      const { data: songsData } = await supabase
        .from('songs')
        .select('*')
        .in('id', songIds)
        .eq('upload_status', 'published');

      if (songsData) {
        setSongs(songsData);
      }
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Library</h1>
        <div className="text-gray-400">
          {songs.length} {songs.length === 1 ? 'song' : 'songs'}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-80 animate-pulse"></div>
          ))}
        </div>
      ) : songs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">Your library is empty</p>
          <p className="text-gray-500 text-sm mt-2">Unlock songs to build your collection</p>
        </div>
      )}
    </div>
  );
}
