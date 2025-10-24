import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Filter, TrendingUp, RefreshCw } from 'lucide-react';
import { SongCard } from '../components/SongCard';
import { SongFeedSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { OnboardingModal } from '../components/OnboardingModal';
import { BuyCreditsModal } from '../components/BuyCreditsModal';
import type { Database } from '../lib/database.types';

type Song = Database['public']['Tables']['songs']['Row'];

const GENRES = ['All', 'Hip-Hop', 'Pop', 'Rock', 'Electronic', 'Classical', 'Indie', 'Jazz', 'R&B'];

export function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState<'haven_heat' | 'newest' | 'price_low' | 'price_high'>('haven_heat');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const { profile } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    if (profile && profile.credits_balance === 10) {
      setTimeout(() => {
        setShowBuyCredits(true);
      }, 2000);
    }
  }, [profile]);

  useEffect(() => {
    fetchSongs();
  }, [selectedGenre, sortBy]);

  const fetchSongs = async (retryCount = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('songs')
        .select('*')
        .eq('upload_status', 'published');

      if (selectedGenre !== 'All') {
        query = query.eq('genre', selectedGenre);
      }

      if (sortBy === 'haven_heat') {
        query = query.order('haven_heat_score', { ascending: false });
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price_low') {
        query = query.order('price_credits', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('price_credits', { ascending: false });
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setSongs(data);
        if (data.length === 0) {
          console.log('convivo:demo-placeholders-shown');
        }
      }
      setLoading(false);
    } catch (err) {
      console.error('convivo:error: Failed to fetch songs', err);

      if (retryCount < 1) {
        showToast('Retrying...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchSongs(retryCount + 1);
      }

      setError('Failed to load songs. Please try again.');
      setLoading(false);
      showToast('Failed to load songs', 'error');
    }
  };

  const handleRetry = () => {
    fetchSongs();
  };

  const filteredSongs = songs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.description && song.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Discover Music</h1>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <span className="text-gray-400 text-sm">Sorted by Haven Heat</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search songs or artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="haven_heat">Haven Heat</option>
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedGenre === genre
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {error ? (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
              aria-label="Retry loading songs"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : loading ? (
          <SongFeedSkeleton />
        ) : filteredSongs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No songs found</p>
            <p className="text-gray-500 text-sm mb-4">Try a different search or genre filter</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition text-sm"
              aria-label="Refresh song list"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('hasSeenOnboarding', 'true');
        }}
      />

      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
      />
    </>
  );
}
