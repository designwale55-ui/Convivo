import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type Transaction = Database['public']['Tables']['credit_transactions']['Row'];
type Song = Database['public']['Tables']['songs']['Row'];

export function AdminPage() {
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    setLoading(true);

    const { data: transactions } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('transaction_type', 'top-up')
      .eq('admin_verified', false)
      .order('created_at', { ascending: false });

    const { data: songs } = await supabase
      .from('songs')
      .select('*')
      .eq('upload_status', 'pending')
      .order('created_at', { ascending: false});

    if (transactions) setPendingTransactions(transactions);
    if (songs) setPendingSongs(songs);

    setLoading(false);
  };

  const handleVerifyPayment = async (transactionId: string, userId: string, credits: number, approve: boolean) => {
    if (!user) return;

    if (approve) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('credits_balance')
        .eq('id', userId)
        .single();

      if (currentUser) {
        await supabase
          .from('users')
          .update({ credits_balance: currentUser.credits_balance + credits })
          .eq('id', userId);
      }

      await supabase
        .from('credit_transactions')
        .update({
          admin_verified: true,
          verified_by_admin_id: user.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', transactionId);
    } else {
      await supabase
        .from('credit_transactions')
        .delete()
        .eq('id', transactionId);
    }

    fetchPendingItems();
  };

  const handleModerateSong = async (songId: string, approve: boolean, notes?: string) => {
    await supabase
      .from('songs')
      .update({
        upload_status: approve ? 'published' : 'rejected',
        moderation_notes: notes || null,
      })
      .eq('id', songId);

    fetchPendingItems();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Pending Credit Top-Ups ({pendingTransactions.length})</h2>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : pendingTransactions.length > 0 ? (
          <div className="space-y-4">
            {pendingTransactions.map((transaction) => (
              <div key={transaction.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{transaction.amount_credits} credits (₹{transaction.amount_inr})</p>
                  <p className="text-gray-400 text-sm">User ID: {transaction.user_id}</p>
                  <p className="text-gray-400 text-sm">Transaction ID: {transaction.transaction_reference}</p>
                  <p className="text-gray-400 text-sm">{new Date(transaction.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVerifyPayment(transaction.id, transaction.user_id, transaction.amount_credits, true)}
                    className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleVerifyPayment(transaction.id, transaction.user_id, transaction.amount_credits, false)}
                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No pending transactions</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Pending Songs ({pendingSongs.length})</h2>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : pendingSongs.length > 0 ? (
          <div className="space-y-4">
            {pendingSongs.map((song) => (
              <div key={song.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex gap-4 mb-4">
                  {song.cover_thumbnail_url && (
                    <img src={song.cover_thumbnail_url} alt={song.title} className="w-24 h-24 rounded object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{song.title}</h3>
                    <p className="text-gray-400">{song.genre} • {song.price_credits} credits</p>
                    {song.description && (
                      <p className="text-gray-300 text-sm mt-2">{song.description}</p>
                    )}
                    <p className="text-gray-400 text-sm mt-2">{new Date(song.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleModerateSong(song.id, true)}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleModerateSong(song.id, false, 'Rejected by admin')}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No pending songs</p>
        )}
      </div>
    </div>
  );
}
