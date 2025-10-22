import { useState } from 'react';
import { X, Coins, Music, TrendingUp } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    icon: Coins,
    title: 'Welcome to Haven',
    description: 'Discover and support independent artists with our credit-based music platform. You start with 10 free credits to get you started!',
  },
  {
    icon: Music,
    title: 'Unlock Songs',
    description: 'Use credits to unlock songs permanently. Each song has a price set by the artist. Once unlocked, it\'s yours forever with a 10-second undo window.',
  },
  {
    icon: TrendingUp,
    title: 'Haven Heat (HH)',
    description: 'Songs are ranked by Haven Heat - a score based on unlocks and listening activity. Discover trending music and support your favorite artists!',
  },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <div className={`w-2 h-2 rounded-full ${currentSlide >= 1 ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
            <div className={`w-2 h-2 rounded-full ${currentSlide >= 2 ? 'bg-orange-500' : 'bg-gray-600'}`}></div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-orange-500 p-4 rounded-full">
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">{slide.title}</h2>
          <p className="text-gray-300 leading-relaxed">{slide.description}</p>
        </div>

        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            {currentSlide < SLIDES.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
