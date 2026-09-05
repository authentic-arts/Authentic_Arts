import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { artCategories, artStyles } from '../data/constants';
import { toKsh, USD_TO_KSH } from '../utils/currency';

const PRESET_IMAGES = [
  { name: 'Landscape Painting', url: 'https://picsum.photos/seed/horizons_upload/800/600' },
  { name: 'Abstract Canvas', url: 'https://picsum.photos/seed/abstract_upload/800/600' },
  { name: 'Bronze Figure', url: 'https://picsum.photos/seed/sculpture_upload/800/600' },
  { name: 'Urban Snapshot', url: 'https://picsum.photos/seed/urban_upload/800/600' },
  { name: 'Cultural Fabric', url: 'https://picsum.photos/seed/mixed_upload/800/600' },
];

export default function ArtistUpload() {
  const navigate = useNavigate();
  const { user, addArtwork } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(artCategories[0]);
  const [style, setStyle] = useState(artStyles[0]);
  const [price, setPrice] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('KSH');
  const [quantity, setQuantity] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [authenticity, setAuthenticity] = useState('');
  const [inspiration, setInspiration] = useState('');
  
  const [dimensions, setDimensions] = useState('');
  const [medium, setMedium] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!user || user.role !== 'artist') {
    navigate('/profile');
    return null;
  }

  const isFormValid =
    title.trim() !== '' &&
    price !== '' &&
    quantity !== '' &&
    image.trim() !== '' &&
    description.trim() !== '' &&
    origin.trim() !== '' &&
    authenticity.trim() !== '';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedPrice = parseFloat(price);
    const parsedQty = parseInt(quantity);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setError('Availability quantity is mandatory and must be a positive integer.');
      return;
    }

    // Normalize price to KSH for consistent storage
    const priceInKsh = priceCurrency === 'USD'
      ? Math.round(parsedPrice * USD_TO_KSH)
      : Math.round(parsedPrice);

    const newArtwork = addArtwork({
      title,
      category,
      style,
      price: priceInKsh,
      currency: 'KSH',
      quantity: parsedQty,
      image,
      description,
      origin,
      authenticity,
      inspiration,
      dimensions: dimensions || 'Variable dimensions',
      medium: medium || 'Mixed media',
      year: parseInt(year) || new Date().getFullYear(),
      tags: [category.toLowerCase(), style.toLowerCase()],
    });

    setSuccess('Artwork uploaded successfully! It is now pending curation review by our administration team.');
    
    // Clear form
    setTitle('');
    setPrice('');
    setPriceCurrency('KSH');
    setQuantity('');
    setImage('');
    setDescription('');
    setOrigin('');
    setAuthenticity('');
    setInspiration('');
    setDimensions('');
    setMedium('');

    // Wait and redirect to dashboard
    setTimeout(() => {
      navigate('/artist/dashboard');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10 shadow-sm space-y-8">
        
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Upload New Artwork</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Submit your piece for curation review. Approved art will be published to the public gallery.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-xl text-center text-sm font-semibold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artwork Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Whispers of the Sahara"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {artCategories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Style *</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {artStyles.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price *</label>
              <div className="flex gap-2">
                <select
                  value={priceCurrency}
                  onChange={(e) => setPriceCurrency(e.target.value)}
                  className="px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                >
                  <option value="KSH">KSH</option>
                  <option value="USD">USD ($)</option>
                </select>
                <input
                  type="number"
                  required
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={priceCurrency === 'KSH' ? 'e.g. 15000' : 'e.g. 120'}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {price && !isNaN(parseFloat(price)) && parseFloat(price) > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {priceCurrency === 'USD'
                    ? `≈ KSh ${Math.round(parseFloat(price) * USD_TO_KSH).toLocaleString('en-KE')} (at ${USD_TO_KSH} KSH/USD)`
                    : `≈ $${(parseFloat(price) / USD_TO_KSH).toFixed(2)} USD`}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity Available *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of pieces"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image Selection */}
            <div className="sm:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artwork Image URL *</label>
              <input
                type="text"
                required
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="space-y-1">
                <span className="block text-xs text-gray-400">Or pick a premium design mock preset:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESET_IMAGES.map((img) => (
                    <button
                      key={img.name}
                      type="button"
                      onClick={() => setImage(img.url)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        image === img.url
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {img.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Spec additions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medium (e.g. Oil on Canvas)</label>
              <input
                type="text"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="e.g. Acrylic and gold leaf"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dimensions (e.g. 100cm x 80cm)</label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="Width x Height"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your artwork's themes, materials, and stylistic techniques..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artwork Origin (Mandatory) *</label>
              <input
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Studio in Nairobi, Kenya"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Authenticity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authenticity Details (Mandatory) *</label>
              <input
                type="text"
                required
                value={authenticity}
                onChange={(e) => setAuthenticity(e.target.value)}
                placeholder="e.g. Signed reverse, Certificate #AA-012"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Inspiration */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inspiration</label>
              <textarea
                rows={3}
                value={inspiration}
                onChange={(e) => setInspiration(e.target.value)}
                placeholder="What was the creative inspiration behind this piece?"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/artist/dashboard')}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl text-sm transition-colors text-center"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                isFormValid
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              Upload Artwork
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
