import { useState } from 'react';
import { Upload, Image, Music, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const GENRES = ['Hip-Hop', 'Pop', 'Rock', 'Electronic', 'Classical', 'Indie', 'Jazz', 'R&B'];
const TIER_RANGES = {
  X: { min: 5, max: 15 },
  Y: { min: 16, max: 30 },
  Z: { min: 31, max: 50 },
};

export function UploadPage() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [priceCredits, setPriceCredits] = useState(10);
  const [coverArt, setCoverArt] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user, profile } = useAuth();

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Cover art must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Cover art must be JPG or PNG');
      return;
    }

    setCoverArt(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('Audio file must be less than 50MB');
      return;
    }

    if (!['audio/mpeg', 'audio/wav', 'audio/flac'].includes(file.type)) {
      setError('Audio must be MP3, WAV, or FLAC');
      return;
    }

    setAudioFile(file);
    setError('');
  };

  const getTier = (price: number): 'X' | 'Y' | 'Z' => {
    if (price <= 15) return 'X';
    if (price <= 30) return 'Y';
    return 'Z';
  };

  const handleSubmit = async () => {
    if (!user || !coverArt || !audioFile) return;

    setLoading(true);
    setError('');

    try {
      const songId = crypto.randomUUID();
      const timestamp = Date.now();

      const coverExt = coverArt.name.split('.').pop();
      const coverPath = `${user.id}/covers/${songId}_${timestamp}.${coverExt}`;
      const { error: coverError } = await supabase.storage
        .from('songs-covers')
        .upload(coverPath, coverArt);

      if (coverError) throw new Error('Failed to upload cover art');

      const audioExt = audioFile.name.split('.').pop();
      const audioPath = `${user.id}/audio/${songId}_${timestamp}.${audioExt}`;
      const { error: audioError } = await supabase.storage
        .from('songs-audio')
        .upload(audioPath, audioFile);

      if (audioError) throw new Error('Failed to upload audio file');

      const { data: { publicUrl: coverUrl } } = supabase.storage
        .from('songs-covers')
        .getPublicUrl(coverPath);

      const { data: { publicUrl: audioUrl } } = supabase.storage
        .from('songs-audio')
        .getPublicUrl(audioPath);

      const { error: dbError } = await supabase
        .from('songs')
        .insert({
          id: songId,
          artist_id: user.id,
          title,
          genre,
          description,
          price_credits: priceCredits,
          price_tier: getTier(priceCredits),
          cover_art_url: coverUrl,
          cover_thumbnail_url: coverUrl,
          audio_url: audioUrl,
          file_size_bytes: audioFile.size,
          upload_status: 'pending',
        });

      if (dbError) throw new Error('Failed to save song');

      setSuccess(true);
      setTitle('');
      setGenre('');
      setDescription('');
      setPriceCredits(10);
      setCoverArt(null);
      setCoverPreview('');
      setAudioFile(null);
      setStep(1);

      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload song');
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = title && genre && priceCredits >= 5 && priceCredits <= 50;
  const canProceedStep2 = coverArt && audioFile;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-white">Upload Song</h1>

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 p-4 rounded-lg">
          Song submitted for review! You'll be notified once it's approved.
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                3
              </div>
            </div>
            <span className="text-gray-400">Step {step} of 3</span>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Song Details</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Song Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="Enter song title"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genre *
                </label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select genre</option>
                  {GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="Tell listeners about your song"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price (Credits) *
                </label>
                <input
                  type="number"
                  value={priceCredits}
                  onChange={(e) => setPriceCredits(parseInt(e.target.value) || 0)}
                  min={5}
                  max={50}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  X Tier: 5-15 credits • Y Tier: 16-30 credits • Z Tier: 31-50 credits
                </p>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next: Upload Files
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Upload Files</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cover Art * (Max 5MB, JPG/PNG)
                </label>
                {coverPreview ? (
                  <div className="relative">
                    <img src={coverPreview} alt="Cover preview" className="w-48 h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => {
                        setCoverArt(null);
                        setCoverPreview('');
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 transition">
                    <Image className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-400">Click to upload cover art</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Audio File * (Max 50MB, MP3/WAV/FLAC)
                </label>
                {audioFile ? (
                  <div className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Music className="w-8 h-8 text-orange-500" />
                      <div>
                        <p className="text-white font-medium">{audioFile.name}</p>
                        <p className="text-gray-400 text-sm">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAudioFile(null)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-orange-500 transition">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-gray-400">Click to upload audio file</span>
                    <input
                      type="file"
                      accept="audio/mpeg,audio/wav,audio/flac"
                      onChange={handleAudioChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white mb-4">Review & Submit</h2>

              <div className="bg-gray-700 rounded-lg p-6 space-y-4">
                <div className="flex gap-4">
                  {coverPreview && (
                    <img src={coverPreview} alt="Cover" className="w-32 h-32 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="text-gray-400">{genre}</p>
                    {description && (
                      <p className="text-gray-300 text-sm mt-2">{description}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white font-medium">{priceCredits} credits (Tier {getTier(priceCredits)})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audio File</span>
                    <span className="text-white">{audioFile?.name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700 rounded-lg p-4">
                <p className="text-gray-300 text-sm">
                  By submitting, you confirm that you own all rights to this music and agree to Haven's terms.
                  Your song will be reviewed by our team, typically within 24 hours.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Uploading...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
