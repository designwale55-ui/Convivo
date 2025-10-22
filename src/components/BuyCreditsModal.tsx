import { useState } from 'react';
import { X, Coins } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CREDIT_BUNDLES = [
  { credits: 50, inr: 40, popular: false },
  { credits: 100, inr: 80, popular: true },
  { credits: 250, inr: 200, popular: false },
  { credits: 500, inr: 400, popular: false },
  { credits: 1000, inr: 800, popular: false },
];

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [selectedBundle, setSelectedBundle] = useState(CREDIT_BUNDLES[1]);
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshProfile } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    if (!transactionId || transactionId.length < 10) {
      setError('Please enter a valid UPI transaction ID');
      setLoading(false);
      return;
    }

    const { error: dbError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'top-up',
        amount_credits: selectedBundle.credits,
        transaction_reference: transactionId,
        admin_verified: false,
      });

    if (dbError) {
      setError('Failed to submit transaction. Please try again.');
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTransactionId('');
      setTimeout(() => {
        refreshProfile();
        setSuccess(false);
        onClose();
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coins className="w-6 h-6 text-orange-500" />
            <h2 className="text-2xl font-bold text-white">Buy Credits</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg text-center">
              <p className="font-medium">Payment submitted successfully!</p>
              <p className="text-sm mt-2">Your credits will be added after admin verification (usually within 24 hours)</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Select Bundle</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CREDIT_BUNDLES.map((bundle) => (
                    <button
                      key={bundle.credits}
                      onClick={() => setSelectedBundle(bundle)}
                      className={`relative p-4 rounded-lg border-2 transition ${
                        selectedBundle.credits === bundle.credits
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-gray-700 bg-gray-700 hover:border-gray-600'
                      }`}
                    >
                      {bundle.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                          Popular
                        </div>
                      )}
                      <div className="text-2xl font-bold text-white">{bundle.credits}</div>
                      <div className="text-sm text-gray-400">credits</div>
                      <div className="text-orange-500 font-medium mt-2">₹{bundle.inr}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-white mb-3">Payment Instructions</h3>
                <ol className="space-y-2 text-sm text-gray-300">
                  <li>1. Scan the QR code below with any UPI app</li>
                  <li>2. Pay exactly ₹{selectedBundle.inr}</li>
                  <li>3. Copy your UPI transaction ID</li>
                  <li>4. Paste it below and submit</li>
                  <li>5. Credits will be added after verification</li>
                </ol>
              </div>

              <div className="mb-6 flex justify-center bg-white p-6 rounded-lg border-2 border-gray-300">
                <img
                  src="/upi-qr-code.svg"
                  alt="UPI QR Code"
                  className="w-64 h-64 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && !parent.querySelector('.qr-placeholder')) {
                      const div = document.createElement('div');
                      div.className = 'qr-placeholder w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300';
                      div.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">📱</div><div class="text-gray-600 font-medium">QR Code Placeholder</div><div class="text-gray-400 text-sm mt-2">Replace upi-qr-code.jpg<br/>in /public folder</div></div>';
                      parent.appendChild(div);
                    }
                  }}
                />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="transactionId" className="block text-sm font-medium text-gray-300 mb-2">
                    UPI Transaction ID
                  </label>
                  <input
                    id="transactionId"
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter 12-digit transaction ID"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Credits</span>
                    <span className="text-white font-medium">{selectedBundle.credits}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount to Pay</span>
                    <span className="text-white font-medium">₹{selectedBundle.inr}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Payment'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
