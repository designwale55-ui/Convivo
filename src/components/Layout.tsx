import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Music, Home, Library, User, Upload, Shield, Coins } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BuyCreditsModal } from './BuyCreditsModal';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [showBuyCredits, setShowBuyCredits] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/', roles: ['listener', 'artist', 'admin'] },
    { icon: Library, label: 'My Library', path: '/library', roles: ['listener', 'artist', 'admin'] },
    { icon: Upload, label: 'Upload', path: '/upload', roles: ['artist'] },
    { icon: Shield, label: 'Admin', path: '/admin', roles: ['admin'] },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-orange-500 p-2 rounded-lg">
                <Music className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Haven</span>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBuyCredits(true)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                <Coins className="w-4 h-4 text-orange-500" />
                <span className="text-white font-medium">Credits: {profile?.credits_balance || 0}</span>
              </button>

              <Link
                to="/profile"
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition"
              >
                <User className="w-4 h-4 text-white" />
                <span className="text-white hidden sm:inline">{profile?.email}</span>
              </Link>

              <button
                onClick={signOut}
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          <nav className="w-64 space-y-2 hidden lg:block">
            {navItems
              .filter((item) => profile && item.roles.includes(profile.role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          <main className="flex-1">{children}</main>
        </div>
      </div>

      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
      />
    </div>
  );
}
