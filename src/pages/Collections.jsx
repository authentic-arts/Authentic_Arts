import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ArtCard from '../components/ArtCard';
import { artCategories, artStyles } from '../data/constants';

export default function Collections() {
  const { artworks } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [filterBestSeller, setFilterBestSeller] = useState(searchParams.get('filter') === 'bestSeller');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setSelectedCategory(cat);
    if (searchParams.get('filter') === 'bestSeller') setFilterBestSeller(true);
  }, [searchParams]);

  const available = artworks.filter(a => a.status === 'available');

  const filtered = available.filter(art => {
    if (search && !art.title.toLowerCase().includes(search.toLowerCase()) &&
        !art.artistName.toLowerCase().includes(search.toLowerCase()) &&
        !art.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (selectedCategory && art.category !== selectedCategory) return false;
    if (selectedStyle && art.style !== selectedStyle) return false;
    if (filterBestSeller && !art.bestSeller) return false;
    if (priceMin && art.price < Number(priceMin)) return false;
    if (priceMax && art.price > Number(priceMax)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === 'newest') return new Date(b.year) - new Date(a.year);
    // featured: best sellers first, then featured
    return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedStyle('');
    setPriceMin('');
    setPriceMax('');
    setFilterBestSeller(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const hasFilters = search || selectedCategory || selectedStyle || priceMin || priceMax || filterBestSeller;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-2">Collections</h1>
          <p className="text-gray-500 dark:text-gray-400">{sorted.length} artworks available</p>

          {/* Search & Sort bar */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search artworks, artists, tags..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-colors ${showFilters ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters {hasFilters && <span className="bg-white text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">!</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {artCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Style</label>
                <select
                  value={selectedStyle}
                  onChange={e => setSelectedStyle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Styles</option>
                  {artStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Min Price ($)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={priceMin}
                  onChange={e => setPriceMin(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide">Max Price ($)</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={priceMax}
                  onChange={e => setPriceMax(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filterBestSeller} onChange={e => setFilterBestSeller(e.target.checked)} className="accent-blue-500 w-4 h-4" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Best Sellers Only</span>
              </label>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600 font-medium ml-auto">
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {sorted.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No artworks found</h3>
            <p className="text-gray-500 dark:text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
            <button onClick={clearFilters} className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sorted.map(art => <ArtCard key={art.id} artwork={art} />)}
          </div>
        )}
      </div>
    </div>
  );
}
