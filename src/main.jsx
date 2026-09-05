import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Home from './pages/Home.jsx';
import Collections from './pages/Collections.jsx';
import ArtworkDetail from './pages/ArtworkDetail.jsx';
import Cart from './pages/Cart.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import Terms from './pages/Terms.jsx';
import Profile from './pages/Profile.jsx';
import ArtistDashboard from './pages/ArtistDashboard.jsx';
import ArtistUpload from './pages/ArtistUpload.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './index.css';

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

// Clear legacy localStorage keys from the old mock-data era.
// These conflict with Supabase auth and would cause stale data to appear.
['aa_user', 'aa_cache'].forEach(k => localStorage.removeItem(k));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index element={<Home />} />
                <Route path="collections" element={<Collections />} />
                <Route path="artwork/:id" element={<ArtworkDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="signin" element={<SignIn />} />
                <Route path="signup" element={<SignUp />} />
                <Route path="terms" element={<Terms />} />
                <Route path="profile" element={<Profile />} />
                <Route path="artist/dashboard" element={<ArtistDashboard />} />
                <Route path="artist/upload" element={<ArtistUpload />} />
                <Route path="admin" element={<AdminPanel />} />
                <Route path="*" element={<Home />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
