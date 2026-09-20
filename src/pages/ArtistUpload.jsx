import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { artCategories, artStyles } from '../data/constants';
import { toKsh, USD_TO_KSH } from '../utils/currency';
import {
  uploadArtworkImage,
  validateImageFile,
  formatFileSize,
  getImageDimensions,
} from '../utils/storage';

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
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(artCategories[0]);
  const [style, setStyle] = useState(artStyles[0]);
  const [price, setPrice] = useState('');
  const [priceCurrency, setPriceCurrency] = useState('KSH');
  const [quantity, setQuantity] = useState('');
  
  // Image handling state
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [description, setDescription] = useState('');
  const [origin, setOrigin] = useState('');
  const [authenticity, setAuthenticity] = useState('');
  const [inspiration, setInspiration] = useState('');
  
  const [dimensions, setDimensions] = useState('');
  const [medium, setMedium] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!user || (user.role !== 'artist' && user.role !== 'admin')) {
    navigate('/profile');
    return null;
  }

  const handleFileChange = async (file) => {
    if (!file) return;
    setError('');

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Clean up previous blob URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreview(previewUrl);

    try {
      const dims = await getImageDimensions(file);
      setFileInfo({
        name: file.name,
        size: formatFileSize(file.size),
        dimensions: dims.width > 0 ? `${dims.width} × ${dims.height} px` : null,
      });
    } catch {
      setFileInfo({
        name: file.name,
        size: formatFileSize(file.size),
        dimensions: null,
      });
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileChange(droppedFile);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('');
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasImage = uploadMode === 'file' ? !!imageFile : imageUrl.trim() !== '';

  const isFormValid =
    title.trim() !== '' &&
    price !== '' &&
    quantity !== '' &&
    hasImage &&
    description.trim() !== '' &&
    origin.trim() !== '' &&
    authenticity.trim() !== '' &&
    !isSubmitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setWarning('');

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

    setIsSubmitting(true);

    try {
      let finalImageUrl = '';

      if (uploadMode === 'file') {
        if (!imageFile) {
          setError('Please select an artwork image file.');
          setIsSubmitting(false);
          return;
        }

        const uploadResult = await uploadArtworkImage(imageFile, user.id);
        finalImageUrl = uploadResult.url;

        if (uploadResult.warning) {
          setWarning(uploadResult.warning);
        }
      } else {
        if (!imageUrl.trim()) {
          setError('Please enter or select a valid image URL.');
          setIsSubmitting(false);
          return;
        }
        finalImageUrl = imageUrl.trim();
      }

      // Normalize price to KSH for consistent storage
      const priceInKsh = priceCurrency === 'USD'
        ? Math.round(parsedPrice * USD_TO_KSH)
        : Math.round(parsedPrice);

      const newArtwork = await addArtwork({
        title,
        category,
        style,
        price: priceInKsh,
        currency: 'KSH',
        quantity: parsedQty,
        image: finalImageUrl,
        description,
        origin,
        authenticity,
        inspiration,
        dimensions: dimensions || 'Variable dimensions',
        medium: medium || 'Mixed media',
        year: parseInt(year) || new Date().getFullYear(),
        tags: [category.toLowerCase(), style.toLowerCase()],
      });

      if (!newArtwork) {
        throw new Error('Failed to save artwork. Please verify your connection and try again.');
      }

      setSuccess('Artwork uploaded successfully! It is now pending curation review by our administration team.');
      
      // Clear form
      setTitle('');
      setPrice('');
      setPriceCurrency('KSH');
      setQuantity('');
      handleRemoveImage();
      setImageUrl('');
      setDescription('');
      setOrigin('');
      setAuthenticity('');
      setInspiration('');
      setDimensions('');
      setMedium('');

      // Redirect to artist dashboard
      setTimeout(() => {
        navigate('/artist/dashboard');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit artwork:', err);
      setError(err.message || 'An unexpected error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10 shadow-sm space-y-8">
        
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Upload New Artwork</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Submit your original piece for curation review. Approved art will be published to the public gallery.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-center text-sm">
            {error}
          </div>
        )}

        {warning && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 p-3 rounded-xl text-xs">
            {warning}
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

            {/* Artwork Image Upload Section */}
            <div className="sm:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Artwork Image *
                </label>
                
                {/* Upload Mode Selector Tabs */}
                <div className="inline-flex rounded-lg p-1 bg-gray-100 dark:bg-gray-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      uploadMode === 'file'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                      uploadMode === 'url'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Image URL / Presets
                  </button>
                </div>
              </div>

              {/* Mode A: Direct File Upload */}
              {uploadMode === 'file' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {!imagePreview ? (
                    <div
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 scale-[1.01]'
                          : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/20'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Drag & drop your artwork image here, or{' '}
                            <span className="text-blue-500 hover:text-blue-600 underline decoration-blue-300">
                              browse files
                            </span>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            High resolution JPEG, PNG, WEBP or GIF (up to 10MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Image Preview Card */
                    <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-4 overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Thumbnail */}
                        <div className="relative w-full sm:w-40 h-40 rounded-xl overflow-hidden bg-gray-900 border border-gray-200 dark:border-gray-700 shrink-0">
                          <img
                            src={imagePreview}
                            alt="Artwork Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>

                        {/* File Details */}
                        <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 mb-1">
                              Ready for upload
                            </span>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={fileInfo?.name}>
                              {fileInfo?.name || 'Artwork image'}
                            </h4>
                          </div>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {fileInfo?.size && (
                              <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                                Size: {fileInfo.size}
                              </span>
                            )}
                            {fileInfo?.dimensions && (
                              <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                                Dimensions: {fileInfo.dimensions}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Change File
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-3 py-1.5 text-xs font-medium bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Direct Image URL & Mock Presets */}
              {uploadMode === 'url' && (
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.example.com/artwork.jpg"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Or select a curated mock preset:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_IMAGES.map((img) => (
                        <button
                          key={img.name}
                          type="button"
                          onClick={() => setImageUrl(img.url)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                            imageUrl === img.url
                              ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                          }`}
                        >
                          {img.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {imageUrl && (
                    <div className="mt-3 flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                      <img
                        src={imageUrl}
                        alt="URL Preview"
                        className="w-14 h-14 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                        onError={(e) => {
                          e.currentTarget.src = 'https://placehold.co/100x100?text=Invalid+URL';
                        }}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 block">Preview URL:</span>
                        <span className="truncate block">{imageUrl}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Medium */}
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

            {/* Dimensions */}
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
              disabled={isSubmitting}
              onClick={() => navigate('/artist/dashboard')}
              className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl text-sm transition-colors text-center disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  {uploadMode === 'file' ? 'Uploading Artwork & Image...' : 'Submitting Artwork...'}
                </>
              ) : (
                'Upload Artwork'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
