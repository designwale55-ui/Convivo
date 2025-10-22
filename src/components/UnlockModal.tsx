import { useState, useEffect } from 'react';
import { X, AlertCircle, Check, Undo2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Song = Database['public']['Tables']['songs']['Row'];

interface UnlockModalProps {
  song: Song;
  artistName: string;
  onClose: () => void;
  onUnlocked: () => void;
}

export function UnlockModal({ song, artistName, onClose, onUnlocked }: UnlockModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [canUseFreeSlot, setCanUseFreeSlot] = useState(false);
  const [useFreeSlot, setUseFreeSlot] = useState(false);
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    if (profile) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const lastReset = profile.last_free_slot_reset ? new Date(profile.last_free_slot_reset) : null;

      const shouldReset = !lastReset ||
        (dayOfWeek === 1 && lastReset < new Date(today.setDate(today.getDate() - 7)));

      setCanUseFreeSlot(shouldReset || profile.free_tester_slots_used < 1);
    }
  }, [profile]);

  useEffect(() => {
    if (showUndo && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setShowUndo(false);
      onUnlocked();
    }
  }, [showUndo, countdown, onUnlocked]);

  const handleUnlock = async () => {
    if (!user || !profile) return;

    if (!useFreeSlot && profile.credits_balance < song.price_credits) {
      setError('Insufficient credits. Please buy more credits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const transactionType = useFreeSlot ? 'free-tester' : 'unlock';
      const creditsToDeduct = useFreeSlot ? 0 : song.price_credits;

      if (!useFreeSlot) {
        const { error: updateError } = await supabase.rpc('deduct_credits', {
          p_user_id: user.id,
          p_amount: song.price_credits
        }).maybeSingle();

        if (updateError) {
          const { data: currentUser } = await supabase
            .from('users')
            .select('credits_balance')
            .eq('id', user.id)
            .single();

          if (currentUser && currentUser.credits_balance >= song.price_credits) {
            await supabase
              .from('users')
              .update({ credits_balance: currentUser.credits_balance - song.price_credits })
              .eq('id', user.id);
          } else {
            throw new Error('Insufficient credits');
          }
        }
      } else {
        await supabase
          .from('users')
          .update({
            free_tester_slots_used: (profile.free_tester_slots_used || 0) + 1,
            last_free_slot_reset: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      const { error: unlockError } = await supabase
        .from('unlocked_songs')
        .insert({
          user_id: user.id,
          song_id: song.id,
        });

      if (unlockError) throw unlockError;

      const amountInr = creditsToDeduct * 0.80;
      const artistShare = amountInr * 0.55;
      const platformCut = amountInr * 0.45;

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: transactionType,
          amount_credits: creditsToDeduct,
          song_id: song.id,
        });

      setUnlocked(true);
      setShowUndo(true);
      setCountdown(10);

      const message = useFreeSlot
        ? `Used your free tester slot for this week - Enjoy '${song.title}' - Next free slot available Monday`
        : `Now you can play '${song.title}' - ${song.price_credits} credits deducted. Artist earns ₹${artistShare.toFixed(2)}, Haven keeps ₹${platformCut.toFixed(2)}`;

      console.log(message);

      await refreshProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock song');
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error: refundError } = await supabase
        .from('unlocked_songs')
        .update({ refunded: true })
        .eq('user_id', user.id)
        .eq('song_id', song.id);

      if (refundError) throw refundError;

      if (!useFreeSlot) {
        const { data: currentUser } = await supabase
          .from('users')
          .select('credits_balance')
          .eq('id', user.id)
          .single();

        if (currentUser) {
          await supabase
            .from('users')
            .update({ credits_balance: currentUser.credits_balance + song.price_credits })
            .eq('id', user.id);
        }

        await supabase
          .from('songs')
          .update({
            total_unlocks: Math.max(0, song.total_unlocks - 1),
            total_credits_earned: Math.max(0, song.total_credits_earned - song.price_credits),
            haven_heat_score: Math.max(0, song.haven_heat_score - 10)
          })
          .eq('id', song.id);
      }

      await supabase
        .from('credit_transactions')
        .insert({
          user_id: user.id,
          transaction_type: 'refund',
          amount_credits: useFreeSlot ? 0 : song.price_credits,
          song_id: song.id,
        });

      await refreshProfile();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {unlocked ? 'Song Unlocked!' : 'Unlock Song'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {!unlocked ? (
            <>
              <div className="flex gap-4 mb-6">
                {song.cover_thumbnail_url ? (
                  <img
                    src={song.cover_thumbnail_url}
                    alt={song.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-700"></div>
                )}
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg">{song.title}</h3>
                  <p className="text-gray-400">{artistName}</p>
                  {song.genre && (
                    <span className="inline-block mt-2 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      {song.genre}
                    </span>
                  )}
                </div>
              </div>

              {canUseFreeSlot && (
                <div className="mb-4 bg-green-500/10 border border-green-500 rounded-lg p-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useFreeSlot}
                      onChange={(e) => setUseFreeSlot(e.target.checked)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="text-green-500 font-medium">Use Free Tester Slot</div>
                      <div className="text-green-400 text-sm">You have 1 free unlock available this week</div>
                    </div>
                  </label>
                </div>
              )}

              <div className="bg-gray-700 p-4 rounded-lg space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-medium">
                    {useFreeSlot ? 'FREE' : `${song.price_credits} credits`}
                  </span>
                </div>
                {!useFreeSlot && profile && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Your Balance</span>
                    <span className={`font-medium ${profile.credits_balance >= song.price_credits ? 'text-green-500' : 'text-red-500'}`}>
                      {profile.credits_balance} credits
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleUnlock}
                disabled={loading || (!useFreeSlot && profile && profile.credits_balance < song.price_credits)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Unlocking...' : useFreeSlot ? 'Use Free Slot' : 'Unlock Now'}
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-500 p-3 rounded-full">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Unlocked Successfully!</h3>
                <p className="text-gray-300 mb-6">
                  {useFreeSlot
                    ? `Used your free tester slot - Enjoy '${song.title}'`
                    : `${song.price_credits} credits deducted`
                  }
                </p>

                {showUndo && (
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Undo available for</span>
                      <span className="text-orange-500 font-bold text-xl">{countdown}s</span>
                    </div>
                    <button
                      onClick={handleUndo}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-500 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
                    >
                      <Undo2 className="w-5 h-5" />
                      <span>Undo Unlock</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
