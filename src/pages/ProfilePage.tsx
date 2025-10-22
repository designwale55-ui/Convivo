import { useAuth } from '../contexts/AuthContext';
import { User, Coins, Music, Calendar } from 'lucide-react';

export function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Profile</h1>

      <div className="bg-gray-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="bg-orange-500 p-4 rounded-full">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile.display_name || profile.email.split('@')[0]}</h2>
            <p className="text-gray-400">{profile.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Coins className="w-5 h-5 text-orange-500" />
              <span className="text-gray-400">Credits Balance</span>
            </div>
            <p className="text-2xl font-bold text-white">{profile.credits_balance}</p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Music className="w-5 h-5 text-orange-500" />
              <span className="text-gray-400">Role</span>
            </div>
            <p className="text-2xl font-bold text-white capitalize">{profile.role}</p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              <span className="text-gray-400">Member Since</span>
            </div>
            <p className="text-white">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>

          {profile.role === 'artist' && profile.tier && (
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-3 mb-2">
                <Music className="w-5 h-5 text-orange-500" />
                <span className="text-gray-400">Artist Tier</span>
              </div>
              <p className="text-2xl font-bold text-white">Tier {profile.tier}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">MFA Enabled</span>
            <span className="text-white">{profile.mfa_enabled ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Free Tester Slots Used This Week</span>
            <span className="text-white">{profile.free_tester_slots_used} / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
