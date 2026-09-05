import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArtCard from '../components/ArtCard';
import { ksh } from '../utils/currency';

export default function Home() {
  const { user, artworks } = useAuth();

  // ⬇️ Paste your Supabase public wallpaper URL right here ⬇️
  const themeWallpaperUrl = "https://fmneiiaqwjnwcdjjeqrs.supabase.co/storage/v1/object/public/Authentic%20Arts%20Logo/Authentic_Arts_Theme.jpeg";

  const availableArtworks = artworks.filter(a => a.status === 'available');
  const bestSellers = availableArtworks.filter(a => a.bestSeller).slice(0, 4);
  const featured = availableArtworks.filter(a => a.featured).slice(0, 3);

  // Personalized feed based on preferred styles
  const personalized = user?.preferredStyles?.length
    ? availableArtworks.filter(a =>
        user.preferredStyles.some(s => a.style?.includes(s) || a.category?.includes(s))
      ).slice(0, 4)
    : [];

  const categories = [
    { name: 'Paintings', icon: '🎨', color: 'from-orange-400 to-red-500' },
    { name: 'Sculptures', icon: '🗿', color: 'from-stone-400 to-gray-600' },
    { name: 'Digital Art', icon: '💻', color: 'from-purple-400 to-indigo-600' },
    { name: 'Photography', icon: '📷', color: 'from-blue-400 to-cyan-500' },
    { name: 'Mixed Media', icon: '✨', color: 'from-pink-400 to-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Hero Container updated with dynamic background positioning */}
      <section 
        className="relative bg-cover bg-center overflow-hidden transition-all duration-300"
        style={{ 
          backgroundImage: `linear-gradient(to bottom right, rgba(17, 24, 39, 0.75), rgba(23, 37, 84, 0.85), rgba(17, 24, 39, 0.9)), url(${themeWallpaperUrl})` 
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <span className="inline-block bg-blue-500/20 text-blue-300 text-sm font-medium px-4 py-1.5 rounded-full border border-blue-500/30 mb-6">
            Curated African Art Exhibition
          </span>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover <span className="text-blue-400">Authentic</span><br />African Art
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            A curated platform connecting collectors with original works from verified African artists. Every piece tells a story.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/collections" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg">
              Explore Collections
            </Link>
            {!user && (
              <Link to="/signup" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg border border-white/20">
                Join as Artist
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-lg mx-auto">
            {[
              { label: 'Artworks', value: '100+' },
              { label: 'Artists', value: '50+' },
              { label: 'Collectors', value: '2K+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-blue-300 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.name}
              to={`/collections?category=${encodeURIComponent(cat.name)}`}
              className={`bg-gradient-to-br ${cat.color} p-6 rounded-2xl text-white text-center hover:scale-105 transition-transform shadow-md`}
            >
              <div className="text-4xl mb-2">{cat.icon}</div>
              <p className="font-semibold text-sm">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Best Sellers</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Most loved by our collectors</p>
            </div>
            <Link to="/collections?filter=bestSeller" className="text-blue-500 hover:text-blue-600 font-medium text-sm">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {bestSellers.map(art => <ArtCard key={art.id} artwork={art} />)}
          </div>
        </section>
      )}

      {/* Personalized Feed */}
      {personalized.length > 0 && (
        <section className="bg-blue-50 dark:bg-blue-950/20 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Curated for You</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Based on your taste: {user?.preferredStyles?.join(', ')}</p>
              </div>
              <Link to="/collections" className="text-blue-500 hover:text-blue-600 font-medium text-sm">See more →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {personalized.map(art => <ArtCard key={art.id} artwork={art} />)}
            </div>
          </div>
        </section>
      )}

      {/* Featured Works */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Featured Works</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Hand-picked by our curators</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featured.map(art => (
              <Link key={art.id} to={`/artwork/${art.id}`} className="group relative overflow-hidden rounded-2xl aspect-[3/4] shadow-lg">
                <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="text-xs font-medium bg-blue-500 text-white px-2.5 py-1 rounded-full mb-2 inline-block">{art.category}</span>
                  <h3 className="text-xl font-bold text-white">{art.title}</h3>
                  <p className="text-gray-300 text-sm">by {art.artistName}</p>
                  <p className="text-blue-300 font-semibold mt-1">{ksh(art.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="bg-blue-500 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl font-bold text-white mb-4">Are You an Artist?</h2>
          <p className="text-blue-100 text-lg mb-8">
            Join Authentic Arts to showcase your work to collectors worldwide. Keep 85% of every sale.
          </p>
          <Link to="/signup" className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg">
            Start Selling Today
          </Link>
        </div>
      </section>
    </div>
  );
}