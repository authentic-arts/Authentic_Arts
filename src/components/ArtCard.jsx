import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ksh } from '../utils/currency';

export default function ArtCard({ artwork }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    addToCart(artwork);
  };

  const discountedPrice = user?.isFirstTimeBuyer
    ? (artwork.price * 0.8).toFixed(2)
    : null;

  return (
    <Link
      to={`/artwork/${artwork.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={artwork.image}
          alt={artwork.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {artwork.bestSeller && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2.5 py-1 rounded-full">
              Best Seller
            </span>
          )}
          {artwork.featured && (
            <span className="bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Featured
            </span>
          )}
          {artwork.status === 'pending' && (
            <span className="bg-orange-400 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Pending Review
            </span>
          )}
        </div>
        {/* Category */}
        <div className="absolute top-3 right-3">
          <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
            {artwork.category}
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-0.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {artwork.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">by {artwork.artistName}</p>

        {artwork.reviewCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating rating={artwork.averageRating} size="sm" />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {artwork.averageRating} ({artwork.reviewCount})
            </span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div>
            {discountedPrice ? (
              <div>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {ksh(discountedPrice)}
                </span>
                <span className="ml-2 text-sm text-gray-400 line-through">{ksh(artwork.price)}</span>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">20% off – first purchase!</div>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {ksh(artwork.price)}
              </span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={artwork.status === 'pending'}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}
