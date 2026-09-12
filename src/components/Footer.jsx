import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('collector');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000); // clear message after 5s
  };

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Brand & Socials */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AA</span>
              </div>
              <span className="font-display text-lg font-bold text-white">Authentic Arts</span>
            </div>
            <p className="text-sm leading-relaxed">
              A curated platform celebrating authentic African artistry. Connecting collectors with original works from verified artists.
            </p>
            {/* Social Icons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:text-white hover:bg-gray-700 transition-all duration-300" aria-label="X (formerly Twitter)">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:text-blue-500 hover:bg-gray-700 transition-all duration-300" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/authenticarts2025/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:text-pink-500 hover:bg-gray-700 transition-all duration-300" aria-label="Instagram">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"/>
                </svg>
              </a>
              <a href="https://wa.me/254742622116" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:text-green-500 hover:bg-gray-700 transition-all duration-300" aria-label="WhatsApp">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.503-5.714-1.46L0 24zm6.59-3.812c1.623.963 3.223 1.47 4.908 1.471 5.378 0 9.753-4.376 9.756-9.758.002-2.607-1.011-5.06-2.855-6.906C16.61 3.15 14.152 2.135 11.542 2.135 6.163 2.135 1.79 6.51 1.787 11.895c-.001 1.722.453 3.4 1.314 4.887l-.993 3.626 3.714-.974z"/>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:text-red-500 hover:bg-gray-700 transition-all duration-300" aria-label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.108C19.53 3.5 12 3.5 12 3.5s-7.53 0-9.388.555A3.003 3.003 0 00.502 6.163C0 8.02 0 12 0 12s0 3.98.502 5.837a3.003 3.003 0 002.11 2.108C4.47 20.5 12 20.5 12 20.5s7.53 0 9.388-.555a3.003 3.003 0 002.11-2.108C24 15.98 24 12 24 12s0-3.98-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://www.tiktok.com/@authentic.arts2025" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-lg hover:text-cyan-400 hover:bg-gray-700 transition-all duration-300" aria-label="TikTok">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12.98 2.66 1.41 4.14 1.48v3.49a8.625 8.625 0 01-4.7-1.42 12.9 12.9 0 01-1.18 5.79c-1.39 3.32-4.66 5.86-8.25 6.07-3.87.13-7.79-2.17-9.08-5.83A9.293 9.293 0 014.28 6.8c1.62-3.21 5.25-5.47 8.92-4.91v3.4c-2.48.06-4.99 1.46-5.74 3.86a5.79 5.79 0 002.72 6.94c2.14 1.27 5.09.97 6.64-1.07.72-.94 1.11-2.11 1.09-3.29.02-3.89 0-7.78.02-11.67v-.04z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/collections" className="hover:text-blue-400 transition-colors">All Collections</Link></li>
              <li><Link to="/collections?category=Paintings" className="hover:text-blue-400 transition-colors">Paintings</Link></li>
              <li><Link to="/collections?category=Sculptures" className="hover:text-blue-400 transition-colors">Sculptures</Link></li>
              <li><Link to="/collections?category=Digital+Art" className="hover:text-blue-400 transition-colors">Digital Art</Link></li>
              <li><Link to="/collections?category=Photography" className="hover:text-blue-400 transition-colors">Photography</Link></li>
            </ul>
          </div>

          {/* Artists */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Artists</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => {
                    if (user?.role === 'artist' || user?.role === 'admin') {
                      navigate('/artist/dashboard', {
                        state: { message: 'You have already been authorized as an artist! Welcome to your dashboard.' }
                      });
                    } else if (user?.role === 'customer') {
                      navigate('/profile', {
                        state: { message: 'You are currently logged in as a Collector. Click "Become a Creator" below to register as an artist.' }
                      });
                    } else {
                      navigate('/signup?role=artist');
                    }
                  }}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Join as Artist
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/signin');
                    } else if (user.role === 'customer') {
                      navigate('/profile', {
                        state: { message: 'Please register as a Creator first before uploading artwork.' }
                      });
                    } else {
                      navigate('/artist/upload');
                    }
                  }}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Upload Artwork
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/signin');
                    } else if (user.role === 'customer') {
                      navigate('/profile', {
                        state: { message: 'You are currently logged in as a Collector. Become a Creator to view the Artist Dashboard.' }
                      });
                    } else {
                      navigate('/artist/dashboard');
                    }
                  }}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Artist Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li><span className="text-gray-500">Privacy Policy</span></li>
              <li><a href="mailto:authentic.arts2025@gmail.com" className="hover:text-blue-400 transition-colors">authentic.arts2025@gmail.com</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider">Newsletter</h4>
            <p className="text-xs leading-relaxed">
              Stay updated on new releases, upcoming exhibitions, and exclusive studio news.
            </p>
            {subscribed ? (
              <div className="bg-blue-900/30 border border-blue-800 text-blue-300 p-3 rounded-lg text-xs font-semibold text-center animate-pulse">
                🎉 Subscribed successfully as {role}!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex border-b border-gray-700 pb-1">
                  <button
                    type="button"
                    onClick={() => setRole('collector')}
                    className={`flex-1 text-[10px] uppercase font-bold py-1 rounded transition-colors ${role === 'collector' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Collector
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('artist')}
                    className={`flex-1 text-[10px] uppercase font-bold py-1 rounded transition-colors ${role === 'artist' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    Artist
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg text-xs placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-blue-500 text-white text-xs font-bold rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Go
                  </button>
                </div>
                {error && <p className="text-[10px] text-red-400">{error}</p>}
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">© {new Date().getFullYear()} Authentic Arts. All rights reserved.</p>
          <p className="text-xs text-gray-600">
            Platform commission: 15% · First-time buyer discount: 20%
          </p>
        </div>
      </div>
    </footer>
  );
}

