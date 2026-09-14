import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import StarRating from '../components/StarRating';
import RoomVisualizerModal from '../components/RoomVisualizerModal';
import { ksh } from '../utils/currency';

const framingOptions = [
  {
    id: 'rolled',
    name: 'Rolled-up Tube Shipping',
    price: 0,
    description: 'Perfect for custom framing locally. Shipped safely in a heavy-duty cardboard tube.'
  },
  {
    id: 'wrap',
    name: 'Canvas Gallery Wrap',
    price: 45,
    description: 'Stretched on a 1.5" deep wood frame. Ready to hang, clean and modern look.'
  },
  {
    id: 'black-frame',
    name: 'Classic Black Wood Frame',
    price: 75,
    description: 'Sleek matte black premium wood frame with a clean white mat board.'
  },
  {
    id: 'oak-frame',
    name: 'Warm Oak Wood Frame',
    price: 85,
    description: 'Natural grain warm oak wood frame with a clean white mat board.'
  },
  {
    id: 'white-frame',
    name: 'Modern White Metal Frame',
    price: 90,
    description: 'Minimalist aluminum white frame with a clean white mat board.'
  }
];

export default function ArtworkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, artworks, reviews, addReview, hasPurchased } = useAuth();
  const { addToCart } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState(framingOptions[0]);

  // Zoom states
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, percentX: 0, percentY: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  
  // Detail Zoom pan states
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    const percentX = (x / width) * 100;
    const percentY = (y / height) * 100;
    setZoomPos({ x, y, percentX, percentY });
  };

  const handlePanStart = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePanMove = (e) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePanEnd = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };
  
  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [userHasPurchased, setUserHasPurchased] = useState(false);

  const artwork = artworks.find((a) => a.id === id);

  // Check purchase status asynchronously
  useEffect(() => {
    if (user && artwork) {
      hasPurchased(artwork.id).then(setUserHasPurchased);
    }
  }, [user, artwork?.id]);

  if (!artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-500">Artwork not found.</p>
          <button onClick={() => navigate('/collections')} className="mt-4 text-blue-500 hover:underline">
            Back to Collections
          </button>
        </div>
      </div>
    );
  }

  // Filter reviews specifically for this artwork
  const artworkReviews = reviews.filter((r) => r.artworkId === artwork.id);

  const handleAddToCart = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    addToCart({
      ...artwork,
      price: currentPrice,
      selectedFrame
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    await addReview({
      artworkId: artwork.id,
      rating,
      comment,
    });

    setComment('');
    setRating(5);
    setReviewMessage('Thank you! Your review has been submitted.');
    setTimeout(() => setReviewMessage(''), 3000);
  };

  const currentPrice = artwork.price + selectedFrame.price;

  const discountedPrice = user?.isFirstTimeBuyer
    ? (currentPrice * 0.8).toFixed(2)
    : null;

  const isOutOfStock = artwork.quantity <= 0;
  const isPending = artwork.status === 'pending';

  const currentImage = artwork.images?.[activeImageIndex] || artwork.image;
  const magnifierLeft = zoomPos.x - 80;
  const magnifierTop = zoomPos.y - 80;
  const panTranslateX = panOffset.x / zoomLevel;
  const panTranslateY = panOffset.y / zoomLevel;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Main Artwork Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Images Section */}
          <div className="lg:col-span-7 space-y-4">
            <div 
              className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-sm cursor-zoom-in group"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setShowMagnifier(true)}
              onMouseLeave={() => setShowMagnifier(false)}
            >
              <img
                src={artwork.images?.[activeImageIndex] || artwork.image}
                alt={artwork.altText || artwork.title}
                className="w-full h-full object-cover select-none"
              />
              
              {/* Magnifier lens */}
              {showMagnifier && (
                <div
                  className="absolute pointer-events-none border-2 border-white dark:border-gray-700 shadow-2xl rounded-full w-40 h-40 overflow-hidden hidden md:block"
                  style={{
                    left: `${magnifierLeft}px`,
                    top: `${magnifierTop}px`,
                    backgroundImage: `url(${currentImage})`,
                    backgroundPosition: `${zoomPos.percentX}% ${zoomPos.percentY}%`,
                    backgroundSize: '250%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              )}
            </div>

            {/* Micro-animations: Interactive Quick Tools */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowZoomModal(true)}
                className="flex-1 py-3 px-4 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-300 hover:scale-[1.01]"
              >
                <span>🔍 Zoom Brushstrokes</span>
              </button>
              <button
                onClick={() => setShowRoomModal(true)}
                className="flex-1 py-3 px-4 bg-white dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-300 hover:scale-[1.01]"
              >
                <span>🖼️ Visualize in Room</span>
              </button>
            </div>
            
            {/* Thumbnails */}
            {artwork.images && artwork.images.length > 1 && (
              <div className="flex gap-3">
                {artwork.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex
                        ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/50'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`thumbnail-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {artwork.category}
                </span>
                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {artwork.style}
                </span>
                {artwork.bestSeller && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2.5 py-1 rounded-full">
                    Best Seller
                  </span>
                )}
                {isPending && (
                  <span className="bg-orange-400 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    Pending Review
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white leading-tight">
                {artwork.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">by <span className="font-semibold">{artwork.artistName}</span></p>
            </div>

            {artwork.reviewCount > 0 && (
              <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                <StarRating rating={artwork.averageRating} size="md" />
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{artwork.averageRating}</span>
                <span className="text-xs text-gray-400">({artwork.reviewCount} customer reviews)</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-sm text-gray-400 block mb-0.5">Price</span>
                  {discountedPrice ? (
                    <div>
                      <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{ksh(discountedPrice)}</span>
                      <span className="text-lg text-gray-400 line-through ml-2">{ksh(currentPrice)}</span>
                      <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-0.5">20% off – First time customer promotion!</p>
                    </div>
                  ) : (
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{ksh(currentPrice)}</span>
                  )}
                </div>
                
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                  isOutOfStock
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                }`}>
                  {isOutOfStock ? 'Sold Out' : 'Available'}
                </span>
              </div>

              {/* Custom Framing Options */}
              <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Select Framing & Shipping:
                </label>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {framingOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedFrame(option)}
                      className={`w-full p-2.5 rounded-xl border text-left flex justify-between items-center gap-3 transition-all duration-200 ${
                        selectedFrame.id === option.id
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selectedFrame.id === option.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {selectedFrame.id === option.id && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white">{option.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 pl-5.5 leading-snug">{option.description}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {option.price === 0 ? 'Free' : `+${ksh(option.price)}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isPending}
                className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-300 ${
                  isOutOfStock || isPending
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {isOutOfStock ? 'Sold Out' : isPending ? 'Pending Curation Review' : 'Add to Cart'}
              </button>

              {/* Sizing & Framing Contact options */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl space-y-2 text-xs border border-gray-150 dark:border-gray-800">
                <span className="font-semibold text-gray-800 dark:text-gray-200">Need custom sizing or materials?</span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                  Our artisans can create custom frames and adjust print/canvas dimensions to your exact specifications.
                </p>
                <div className="flex gap-2 pt-1">
                  <a href="mailto:authentic.arts2025@gmail.com?subject=Bespoke%20Framing%20Request" className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-805 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 text-center transition-colors">
                    Email
                  </a>
                  <a href="https://wa.me/254742622116" target="_blank" rel="noopener noreferrer" className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-805 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 text-center transition-colors">
                    WhatsApp
                  </a>
                  <a href="tel:+254742622116" className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-805 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 text-center transition-colors">
                    Call
                  </a>
                </div>
              </div>
            </div>

            {/* Spec grid */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400 block">Medium</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{artwork.medium}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Dimensions</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{artwork.dimensions}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Year</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{artwork.year}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Origin</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{artwork.origin.split('.')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Extended Description, Inspiration, Provenance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">About the Artwork</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{artwork.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Inspiration</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{artwork.inspiration}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Origin & Authenticity</h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>📍 <strong className="text-gray-800 dark:text-white">Origin:</strong> {artwork.origin}</p>
              <p>📜 <strong className="text-gray-800 dark:text-white">Authenticity:</strong> {artwork.authenticity}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Customer Reviews ({artworkReviews.length})
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Reviews List */}
            <div className="lg:col-span-7 space-y-4">
              {artworkReviews.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-500">
                  No reviews for this artwork yet.
                </div>
              ) : (
                artworkReviews.map((rev) => (
                  <div key={rev.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <img src={rev.userAvatar} alt={rev.userName} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{rev.userName}</p>
                          {rev.verified && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-150">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400">{rev.date}</p>
                      </div>
                      <div className="ml-auto">
                        <StarRating rating={rev.rating} size="sm" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                      "{rev.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Write a Review Section */}
            <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Write a Review</h3>
              
              {reviewMessage && (
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-xl text-center text-sm font-medium mb-4">
                  {reviewMessage}
                </div>
              )}

              {user && userHasPurchased ? (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                    <StarRating
                      rating={rating}
                      max={5}
                      interactive={true}
                      onChange={(r) => setRating(r)}
                      size="lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Review</label>
                    <textarea
                      rows={4}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your thoughts about this artwork..."
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors shadow-md shadow-blue-500/10"
                  >
                    Submit Review
                  </button>
                </form>
              ) : (
                <div className="text-center p-6 text-sm text-gray-500 leading-relaxed">
                  🔒 Reviews are restricted to customers who have purchased this specific artwork.
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Texture Zoom Lightbox Modal */}
      {showZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-display font-semibold text-gray-900 dark:text-white">Detail & Brushstroke Zoom</h3>
              <button 
                onClick={() => { setShowZoomModal(false); setZoomLevel(1.5); setPanOffset({ x: 0, y: 0 }); }} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div 
              className="flex-1 bg-gray-950 flex items-center justify-center overflow-hidden relative min-h-[400px] cursor-grab active:cursor-grabbing"
              onMouseDown={handlePanStart}
              onMouseMove={handlePanMove}
              onMouseUp={handlePanEnd}
              onMouseLeave={handlePanEnd}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handlePanEnd}
            >
              <img
                src={artwork.images?.[activeImageIndex] || artwork.image}
                alt={artwork.altText || artwork.title}
                style={{
                  transform: `scale(${zoomLevel}) translate(${panTranslateX}px, ${panTranslateY}px)`,
                  transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                  maxHeight: '65vh',
                  maxWidth: '100%',
                  objectFit: 'contain'
                }}
                className="select-none pointer-events-none"
              />
            </div>

            <div className="p-5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold text-gray-750 dark:text-gray-250">-</button>
                  <span className="text-sm font-semibold w-16 text-center text-gray-700 dark:text-gray-300">{Math.round(zoomLevel * 100)}%</span>
                  <button onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.25))} className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-bold text-gray-750 dark:text-gray-250">+</button>
                  <button onClick={() => { setZoomLevel(1.5); setPanOffset({ x: 0, y: 0 }); }} className="ml-2 px-3 py-1.5 rounded-lg text-xs bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium text-gray-700 dark:text-gray-300">Reset</button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 Drag or swipe to explore the brushstrokes and canvas texture in high resolution.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Visualizer Modal */}
      <RoomVisualizerModal
        isOpen={showRoomModal}
        onClose={() => setShowRoomModal(false)}
        artwork={artwork}
        framingOptions={framingOptions}
        selectedFrame={selectedFrame}
        onSelectFrame={setSelectedFrame}
      />

    </div>
  );
}
