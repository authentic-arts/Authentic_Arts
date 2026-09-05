import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { artStyles } from '../data/constants';
import { ksh } from '../utils/currency';

export default function Profile() {
  const { user, updateUser, switchToArtist, artworks } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [location, setLocation] = useState(user?.location || '');
  const [preferredStyles, setPreferredStyles] = useState(user?.preferredStyles || []);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) {
    navigate('/signin');
    return null;
  }

  // Get purchased artwork details
  const myPurchases = artworks.filter((a) => user.purchasedArtworks?.includes(a.id));

  const handleStyleToggle = (style) => {
    setPreferredStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateUser({
      name,
      email,
      location,
      preferredStyles,
    });
    setEditing(false);
    setMessage('Profile updated successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSwitchArtist = () => {
    if (window.confirm('Do you want to register as an Artist/Creator? This will create your artist profile and dashboard.')) {
      switchToArtist();
      setMessage('Congratulations! You are now a registered Artist.');
      setTimeout(() => {
        setMessage('');
        navigate('/artist/dashboard');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {message && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-4 rounded-xl text-center text-sm font-semibold">
            {message}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-100 dark:ring-blue-900/50"
            />
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 {user.location}</p>
            </div>
            
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-center"
                >
                  Edit Profile
                </button>
              )}
              {user.role === 'customer' && (
                <button
                  onClick={handleSwitchArtist}
                  className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-center"
                >
                  Become a Creator
                </button>
              )}
              {user.role === 'artist' && (
                <button
                  onClick={() => navigate('/artist/dashboard')}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-250 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-center"
                >
                  Artist Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Editing Mode */}
          {editing ? (
            <form onSubmit={handleSave} className="space-y-6 pt-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preferences Editor */}
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Art Styles</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {artStyles.map((style) => {
                    const selected = preferredStyles.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => handleStyleToggle(style)}
                        className={`text-xs text-center px-3 py-2 rounded-lg font-medium border transition-colors ${
                          selected
                            ? 'bg-blue-500 border-blue-500 text-white'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {style}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(user.name);
                    setEmail(user.email);
                    setLocation(user.location);
                    setPreferredStyles(user.preferredStyles || []);
                  }}
                  className="bg-gray-150 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">My Art Preferences</h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.preferredStyles?.map((style) => (
                    <span
                      key={style}
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30"
                    >
                      {style}
                    </span>
                  ))}
                  {(!user.preferredStyles || user.preferredStyles.length === 0) && (
                    <span className="text-sm text-gray-500">No preferred art styles selected.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Purchase History */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order History</h2>
          {myPurchases.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl">🛍️</span>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">You haven't bought any artworks yet.</p>
              <button
                onClick={() => navigate('/collections')}
                className="mt-4 text-blue-500 hover:text-blue-600 font-semibold text-sm"
              >
                Browse Collections →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {myPurchases.map((art) => (
                <div key={art.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <img src={art.image} alt={art.title} className="w-16 h-16 object-cover rounded-lg" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{art.title}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">by {art.artistName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2.5 py-1 rounded-full font-semibold mb-1.5 inline-block">
                      Delivered
                    </span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{ksh(art.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
